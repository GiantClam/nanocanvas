
import { GoogleGenAI } from "@google/genai";
import { ModelType, NanoCanvasConfig, BillingCallback, BillingEvent } from "../types";

// Helper to find closest supported aspect ratio
const getClosestAspectRatio = (width: number, height: number): string => {
  const ratio = width / height;
  const supported = [
    { str: "1:1", val: 1.0 },
    { str: "3:4", val: 0.75 },
    { str: "4:3", val: 1.333 },
    { str: "9:16", val: 0.5625 },
    { str: "16:9", val: 1.777 },
  ];
  return supported.reduce((prev, curr) => 
    Math.abs(curr.val - ratio) < Math.abs(prev.val - ratio) ? curr : prev
  ).str;
};

const isNotFoundError = (error: any): boolean => {
  if (!error) return false;
  try {
      if (error.error) {
        const { code, status, message } = error.error;
        if (code === 404 || status === 'NOT_FOUND') return true;
        if (message && message.includes("Requested entity was not found")) return true;
      }
      if (error.status === 404 || error.code === 404 || error.status === 'NOT_FOUND') return true;
      const msg = error.message || (typeof error.toString === 'function' ? error.toString() : '');
      return msg.includes("Requested entity was not found") || msg.includes("404") || msg.includes("NOT_FOUND");
  } catch (e) {
      return false;
  }
};

export interface GenerateOptions {
  prompt: string;
  model: ModelType;
  images?: string[];
  referenceWidth?: number;
  referenceHeight?: number;
}

export class NanoAI {
  private config: NanoCanvasConfig;
  private onBilling?: BillingCallback;

  constructor(config: NanoCanvasConfig, onBilling?: BillingCallback) {
    this.config = config;
    this.onBilling = onBilling;
  }

  private getApiKey(): string {
    return this.config.apiKey || process.env.API_KEY || '';
  }

  private emitBilling(event: Omit<BillingEvent, 'timestamp'>) {
    if (this.onBilling) {
      this.onBilling({ ...event, timestamp: Date.now() });
    }
  }

  public async generateContent(options: GenerateOptions): Promise<{ text?: string; imageBase64?: string }> {
    const { prompt, model, images } = options;

    const imageDataUrl = images && images.length > 0 ? `data:image/png;base64,${images[0]}` : undefined;

    const response = await fetch('/api/ai/image/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, model, image: imageDataUrl })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      this.emitBilling({ model, operation: 'image', status: 'error', costMetric: result.error });
      throw new Error(result.error || 'Image generation failed');
    }

    const imageUrl = result.data?.imageUrl || result.data?.editedImageUrl;
    if (!imageUrl) {
      this.emitBilling({ model, operation: 'image', status: 'error' });
      throw new Error('No image returned');
    }

    this.emitBilling({ model, operation: 'image', status: 'success' });
    return { imageBase64: (imageUrl as string).split(',')[1] };
  }

  public async generateVideoContent(options: GenerateOptions): Promise<string> {
    const { prompt, model, images } = options;
    // Ensure API Key selection for Google Veo models if running via AI Studio helper
    if ((model === ModelType.VEO_HQ || model === ModelType.VEO_FAST) && this.config.provider === 'google') {
      if (typeof window !== 'undefined' && (window as any).aistudio) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if (!hasKey) await (window as any).aistudio.openSelectKey();
      }
    }

    const imageDataUrl = images && images.length > 0 ? `data:image/png;base64,${images[0]}` : undefined;

    const response = await fetch('/api/ai/video/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, model, image: imageDataUrl })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      this.emitBilling({ model, operation: 'video', status: 'error', costMetric: result.error });
      throw new Error(result.error || 'Video generation failed');
    }

    const videoUrl = result.data?.videoUrl;
    if (!videoUrl) {
      this.emitBilling({ model, operation: 'video', status: 'error' });
      throw new Error('No video returned');
    }

    this.emitBilling({ model, operation: 'video', status: 'success' });
    return videoUrl as string;
  }
}

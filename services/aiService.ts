import { ModelType, NanoCanvasConfig, BillingCallback, BillingEvent } from "../types";

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

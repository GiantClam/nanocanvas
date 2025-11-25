
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
    const { prompt, model, images, referenceWidth, referenceHeight } = options;

    if (this.config.provider === 'vertex') {
        console.warn("Vertex AI provider selected but implementation is currently using GoogleGenAI fallback logic for demo.");
        // In a real scenario, this would initialize a Vertex AI client or call a proxy
    }

    const execute = async (retry: boolean = true): Promise<{ text?: string; imageBase64?: string }> => {
      // 1. Handle API Key for Pro models (only relevant for Google Provider client-side)
      if (model === ModelType.NANO_BANANA_2 && this.config.provider === 'google') {
        if (window.aistudio) {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          if (!hasKey) await window.aistudio.openSelectKey();
        }
      }

      // 2. Initialize Client
      const ai = new GoogleGenAI({ apiKey: this.getApiKey() });

      // 3. Prepare Contents
      const parts: any[] = [];
      if (images && images.length > 0) {
        images.forEach(img => {
           parts.push({ inlineData: { mimeType: 'image/png', data: img } });
        });
      }
      parts.push({ text: prompt });

      // 4. Config
      let imageConfig: any = {};
      if (referenceWidth && referenceHeight) {
        imageConfig.aspectRatio = getClosestAspectRatio(referenceWidth, referenceHeight);
      } else {
        imageConfig.aspectRatio = "1:1";
      }
      if (model === ModelType.NANO_BANANA_2) {
        imageConfig.imageSize = "1K";
      }

      try {
        const response = await ai.models.generateContent({
          model: model,
          contents: { parts },
          config: { imageConfig }
        });

        let resultText = '';
        let resultImage = '';

        if (response.candidates && response.candidates.length > 0) {
          const content = response.candidates[0].content;
          if (content && content.parts) {
            for (const part of content.parts) {
              if (part.inlineData) resultImage = part.inlineData.data;
              else if (part.text) resultText += part.text;
            }
          }
        }

        this.emitBilling({ model, operation: 'image', status: 'success', costMetric: response.usageMetadata });
        return { text: resultText, imageBase64: resultImage };

      } catch (error: any) {
        // Retry logic for 404s (API Key selection)
        if (retry && model === ModelType.NANO_BANANA_2 && isNotFoundError(error) && this.config.provider === 'google') {
          if (window.aistudio) {
            await window.aistudio.openSelectKey();
            return execute(false);
          }
        }
        this.emitBilling({ model, operation: 'image', status: 'error', costMetric: error });
        console.error("Gemini API Error:", error);
        throw error;
      }
    };

    return execute();
  }

  public async generateVideoContent(options: GenerateOptions): Promise<string> {
    const { prompt, model, images } = options;

    const execute = async (retry: boolean = true): Promise<string> => {
      // Mandatory API Key Check for Veo HQ
      if (model === ModelType.VEO_HQ && this.config.provider === 'google') {
          if (window.aistudio) {
              const hasKey = await window.aistudio.hasSelectedApiKey();
              if (!hasKey) await window.aistudio.openSelectKey();
          }
      }

      const ai = new GoogleGenAI({ apiKey: this.getApiKey() });
      const config: any = {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
      };

      let operation;

      try {
          if (images && images.length > 0) {
              operation = await ai.models.generateVideos({
                  model: model,
                  prompt: prompt,
                  image: { imageBytes: images[0], mimeType: 'image/png' },
                  config
              });
          } else {
              operation = await ai.models.generateVideos({
                  model: model,
                  prompt: prompt,
                  config
              });
          }

          while (!operation.done) {
              await new Promise(resolve => setTimeout(resolve, 5000));
              operation = await ai.operations.getVideosOperation({ operation: operation });
          }

          const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
          if (!downloadLink) throw new Error("No video URI returned");

          const response = await fetch(`${downloadLink}&key=${this.getApiKey()}`);
          const blob = await response.blob();
          
          this.emitBilling({ model, operation: 'video', status: 'success' });
          return URL.createObjectURL(blob);

      } catch (error: any) {
          if (retry && isNotFoundError(error) && this.config.provider === 'google') {
               if (window.aistudio) {
                  await window.aistudio.openSelectKey();
                  return execute(false);
               }
          }
          this.emitBilling({ model, operation: 'video', status: 'error', costMetric: error });
          console.error("Veo Generation Error:", error);
          throw error;
      }
    };

    return execute();
  }
}

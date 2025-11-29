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

  private async dataUrlToFile(dataUrl: string, filename: string): Promise<File> {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type || 'image/png' });
  }

  private async uploadToCloudflare(dataUrl: string, folder: string = 'ai-generated'):
    Promise<{ url: string, display?: string, thumbnail?: string }> {
    const file = await this.dataUrlToFile(dataUrl, `nano-${Date.now()}.png`);
    const form = new FormData();
    form.append('file', file);
    form.append('folder', folder);
    const resp = await fetch('/api/storage/cloudflare-images/upload', { method: 'POST', body: form });
    const json = await resp.json();
    if (!resp.ok || !json.success) throw new Error(json.error || 'Cloudflare upload failed');
    const variants = json.data?.variants || {};
    console.log('uploadToCloudflare result', { url: json.data?.url, variants });
    return { url: json.data?.url, display: variants.display, thumbnail: variants.thumbnail };
  }

  public async uploadImageDataUrl(dataUrl: string, folder?: string): Promise<string> {
    const uploaded = await this.uploadToCloudflare(dataUrl, folder || 'uploads');
    return uploaded.display || uploaded.url;
  }

  public async generateContent(options: GenerateOptions): Promise<{ text?: string; imageBase64?: string; imageUrl?: string }> {
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

    let finalUrl = imageUrl as string;
    if (finalUrl.startsWith('data:')) {
      try {
        const uploaded = await this.uploadToCloudflare(finalUrl);
        finalUrl = uploaded.display || uploaded.url;
        console.log('generateContent uploaded image url', finalUrl);
      } catch (e) {
        console.warn('Cloudflare upload failed, using data URL locally', e);
      }
    }

    this.emitBilling({ model, operation: 'image', status: 'success' });
    return {
      imageUrl: finalUrl,
      imageBase64: finalUrl.startsWith('data:') && (finalUrl as string).includes(',') ? (finalUrl as string).split(',')[1] : undefined
    };
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

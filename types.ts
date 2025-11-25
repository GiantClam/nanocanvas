
export enum ModelType {
  NANO_BANANA_1 = 'gemini-2.5-flash-image',
  NANO_BANANA_2 = 'gemini-3-pro-image-preview',
  VEO_FAST = 'veo-2.0-generate-preview',
  VEO_HQ = 'veo-3.1-generate-preview',
}

export type TemplateType = 'create' | 'edit' | 'video';

export interface Template {
  id: string;
  name: string;
  description: string;
  promptTemplate: string;
  type: TemplateType;
  icon: string;
  requiresImage: boolean;
  category: string;
}

export type TaskStatus = 'loading' | 'success' | 'error';

export interface Task {
  id: string;
  type: 'generate' | 'edit' | 'video';
  status: TaskStatus;
  prompt: string;
  timestamp: number;
  model: ModelType;
  error?: string;
}

export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  hasSelection: boolean;
}

export interface SelectedProperties {
  stroke: string;
  strokeWidth: number;
  fill: string;
  fontSize: number;
  type: string;
}

export interface AIData {
  prompt: string;
  model: ModelType;
  timestamp: number;
}

// --- Refactoring Types ---

export type AIProviderType = 'google' | 'vertex' | 'custom';

export interface NanoCanvasConfig {
  provider: AIProviderType;
  apiKey?: string; // For Google GenAI
  projectId?: string; // For Vertex AI
  location?: string; // For Vertex AI
  customEndpoint?: string; // For Proxy/Custom
}

export interface BillingEvent {
  model: string;
  operation: 'image' | 'video';
  status: 'success' | 'error';
  costMetric?: any; // e.g., token count, duration, or raw response meta
  timestamp: number;
}

export type BillingCallback = (event: BillingEvent) => void;

export interface NanoCanvasProps {
  config?: NanoCanvasConfig;
  initialCanvasState?: object; // Fabric JSON object
  onBillingEvent?: BillingCallback;
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    fabric: any;
    aistudio?: AIStudio;
  }
}


import { GoogleGenAI } from "@google/genai";
import { ModelType } from "../types";

// User provided API Key

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
  
  // Find the aspect ratio with the smallest difference
  return supported.reduce((prev, curr) => 
    Math.abs(curr.val - ratio) < Math.abs(prev.val - ratio) ? curr : prev
  ).str;
};

interface GenerateOptions {
  prompt: string;
  model: ModelType;
  images?: string[]; // Array of base64 strings
  referenceWidth?: number;
  referenceHeight?: number;
}

const isNotFoundError = (error: any): boolean => {
  if (!error) return false;

  try {
      // 1. Check if it's a raw JSON object with { error: { ... } } structure (Common in Google APIs)
      if (error.error) {
        const code = error.error.code;
        const status = error.error.status;
        const message = error.error.message;
        
        if (code === 404 || status === 'NOT_FOUND') return true;
        if (message && message.includes("Requested entity was not found")) return true;
      }

      // 2. Check top-level properties (if error was flattened or is a custom Error class)
      if (error.status === 404 || error.code === 404 || error.status === 'NOT_FOUND') return true;
      
      // 3. Check error message string (handle cases where JSON is stringified in message)
      const msg = error.message || (typeof error.toString === 'function' ? error.toString() : '');
      return msg.includes("Requested entity was not found") || msg.includes("404") || msg.includes("NOT_FOUND");
  } catch (e) {
      return false;
  }
};

export const generateContent = async (options: GenerateOptions): Promise<{ text?: string; imageBase64?: string }> => {
  const { prompt, model, images, referenceWidth, referenceHeight } = options;

  const execute = async (retry: boolean = true): Promise<{ text?: string; imageBase64?: string }> => {
    // 1. Handle API Key for Pro models (Nano Banana 2)
    if (model === ModelType.NANO_BANANA_2) {
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await window.aistudio.openSelectKey();
        }
      }
    }

    // 2. Initialize Client
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // 3. Prepare Contents
    const parts: any[] = [];
    
    if (images && images.length > 0) {
      images.forEach(img => {
         parts.push({
          inlineData: {
            mimeType: 'image/png',
            data: img
          }
        });
      });
    }

    parts.push({ text: prompt });

    // 4. Configure Image Generation Settings
    let imageConfig: any = {};
    
    // Determine Aspect Ratio if dimensions are provided
    if (referenceWidth && referenceHeight) {
      imageConfig.aspectRatio = getClosestAspectRatio(referenceWidth, referenceHeight);
    } else {
      imageConfig.aspectRatio = "1:1";
    }

    // Specific config for Pro model (Nano Banana 2)
    if (model === ModelType.NANO_BANANA_2) {
      imageConfig.imageSize = "1K"; // Default to 1K for balance of speed/quality
    }

    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: { parts },
        config: {
          imageConfig
        }
      });

      let resultText = '';
      let resultImage = '';

      // 5. Parse Response
      if (response.candidates && response.candidates.length > 0) {
        const content = response.candidates[0].content;
        if (content && content.parts) {
          for (const part of content.parts) {
            if (part.inlineData) {
              resultImage = part.inlineData.data;
            } else if (part.text) {
              resultText += part.text;
            }
          }
        }
      }

      return { text: resultText, imageBase64: resultImage };

    } catch (error: any) {
      // Handle 404 / Invalid Key for Paid Models
      if (retry && model === ModelType.NANO_BANANA_2 && isNotFoundError(error)) {
        console.warn("404 Error (Entity Not Found) detected. Prompting for key re-selection...");
        if (window.aistudio) {
          await window.aistudio.openSelectKey();
          // Retry the operation once with the new key
          return execute(false);
        }
      }
      console.error("Gemini API Error:", error);
      throw error;
    }
  };

  return execute();
};

export const generateVideoContent = async (options: GenerateOptions): Promise<string> => {
  const { prompt, model, images } = options;

  const execute = async (retry: boolean = true): Promise<string> => {
    // 1. Mandatory API Key Check
    // Check for both VEO_HQ and VEO_FAST (Veo 2) to prevent 404s.
    if (model === ModelType.VEO_HQ || model === ModelType.VEO_FAST) {
        if (window.aistudio) {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            if (!hasKey) {
                await window.aistudio.openSelectKey();
            }
        }
    }

    // 2. Initialize Client
    // Important: Create new instance to pick up key if just selected
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // 3. Prepare Config
    // Veo supports 16:9 or 9:16. Let's default to 16:9 for canvas unless we had stricter dimension checks.
    // Assuming 720p for compatibility.
    const config: any = {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
    };

    let operation;

    try {
        if (images && images.length > 0) {
            // Image to Video
            operation = await ai.models.generateVideos({
                model: model,
                prompt: prompt,
                image: {
                    imageBytes: images[0],
                    mimeType: 'image/png'
                },
                config
            });
        } else {
            // Text to Video
            operation = await ai.models.generateVideos({
                model: model,
                prompt: prompt,
                config
            });
        }

        // 4. Polling Loop
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // 5s interval
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        // 5. Retrieve Video URL
        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) throw new Error("No video URI returned");

        // 6. Fetch Video Blob (appending key is required)
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const blob = await response.blob();
        return URL.createObjectURL(blob);

    } catch (error: any) {
        // Handle 404 / Invalid Key for Veo
        if (retry && isNotFoundError(error)) {
             console.warn("404 Error (Entity Not Found) detected during Veo generation. Prompting for key re-selection...");
             if (window.aistudio) {
                await window.aistudio.openSelectKey();
                // Retry the operation once with the new key
                return execute(false);
             }
        }

        console.error("Veo Generation Error:", error);
        throw error;
    }
  };

  return execute();
};


export const APP_NAME = "NanoCanvas AI";

import type { Template } from './types'

export const TEMPLATES: Template[] = [
  {
    id: 'basic_create_1',
    name: 'Text to Image',
    description: 'Generate an image from a text prompt',
    promptTemplate: 'A detailed, high-quality image of ${subject}',
    type: 'create',
    icon: 'image',
    requiresImage: false,
    category: 'artistic'
  },
  {
    id: 'basic_edit_1',
    name: 'Single Image Edit',
    description: 'Edit the selected image object with AI',
    promptTemplate: 'Enhance the selected object: ${instruction}',
    type: 'edit',
    icon: 'edit',
    requiresImage: true,
    category: 'utility'
  },
  {
    id: 'video_generate_1',
    name: 'Video Motion',
    description: 'Generate short motion video from a prompt',
    promptTemplate: 'Create a smooth motion video about ${subject}',
    type: 'video',
    icon: 'video',
    requiresImage: false,
    category: 'video'
  },
  {
    id: 'logo_design_1',
    name: 'Logo Concept',
    description: 'Generate minimal logo concepts',
    promptTemplate: 'Minimal vector logo for ${brand}',
    type: 'create',
    icon: 'logo',
    requiresImage: false,
    category: 'design'
  },
  {
    id: 'portrait_retouch_1',
    name: 'Portrait Retouch',
    description: 'Retouch a portrait photo with natural tones',
    promptTemplate: 'Retouch the portrait to be natural and clean',
    type: 'edit',
    icon: 'retouch',
    requiresImage: true,
    category: 'photography'
  },
  {
    id: 'sci_fi_scene_1',
    name: 'Sci-Fi Scene',
    description: 'Create a neon cyberpunk city scene',
    promptTemplate: 'Neon cyberpunk city at night, rain, reflections',
    type: 'create',
    icon: 'sparkles',
    requiresImage: false,
    category: 'sci-fi'
  }
];


import { Template } from './types';
import React from 'react';
import { Layout, Zap, PenTool, Layers, Palette, Sparkles, Blend, BoxSelect, Eraser, Scissors, Film, Video, Camera } from 'lucide-react';

export const APP_NAME = "NanoCanvas AI";

export const TEMPLATES: Template[] = [
  // --- Creation (Text to Image) ---
  {
    id: 't_cyberpunk',
    name: 'Cyberpunk City',
    description: 'Neon-lit futuristic street.',
    promptTemplate: 'A futuristic cyberpunk city street at night, neon lights, rain, highly detailed, 8k resolution',
    type: 'create',
    icon: 'Layout',
    requiresImage: false,
    category: 'Sci-Fi'
  },
  {
    id: 't_3d_char',
    name: '3D Character',
    description: 'Pixar-style cute robot.',
    promptTemplate: 'A cute 3D rendered robot character, pixar style, bright colors, studio lighting, 4k',
    type: 'create',
    icon: 'BoxSelect',
    requiresImage: false,
    category: '3D Art'
  },
  {
    id: 't_logo',
    name: 'Vector Logo',
    description: 'Minimalist flat design.',
    promptTemplate: 'Minimalist vector logo design of a abstract fox, flat color, clean lines, white background',
    type: 'create',
    icon: 'Zap',
    requiresImage: false,
    category: 'Design'
  },
  {
    id: 't_landscape',
    name: 'Epic Landscape',
    description: 'Mountains and lakes.',
    promptTemplate: 'Majestic mountain landscape with a reflection in a calm lake, sunset, photorealistic, national geographic style',
    type: 'create',
    icon: 'Layout',
    requiresImage: false,
    category: 'Photography'
  },
  {
    id: 't_anime_portrait',
    name: 'Anime Portrait',
    description: 'Studio ghibli style.',
    promptTemplate: 'Anime portrait of a young wizard, studio ghibli art style, detailed background, vibrant colors',
    type: 'create',
    icon: 'Sparkles',
    requiresImage: false,
    category: 'Anime'
  },
  {
    id: 't_oil_painting',
    name: 'Oil Painting',
    description: 'Classic impressionist.',
    promptTemplate: 'Oil painting of a busy cafe in Paris, impressionist style, textured brushstrokes, van gogh influence',
    type: 'create',
    icon: 'Palette',
    requiresImage: false,
    category: 'Artistic'
  },

  // --- Editing (Image/Selection to Image) ---
  {
    id: 't_watercolor',
    name: 'Watercolorify',
    description: 'Turn selection into art.',
    promptTemplate: 'Convert this image into a soft watercolor painting, pastel colors, artistic brush strokes, paper texture',
    type: 'edit',
    icon: 'Palette',
    requiresImage: true,
    category: 'Artistic'
  },
  {
    id: 't_realistic',
    name: 'Sketch to Real',
    description: 'Render sketch as photo.',
    promptTemplate: 'Photorealistic render of the sketched scene, cinematic lighting, unreal engine 5 style, high texture detail',
    type: 'edit',
    icon: 'PenTool',
    requiresImage: true,
    category: '3D Art'
  },
  {
    id: 't_blend',
    name: 'Fantasy Blend',
    description: 'Merge elements magically.',
    promptTemplate: 'Seamlessly blend these elements into a magical fantasy landscape, glowing atmosphere, coherent lighting',
    type: 'edit',
    icon: 'Sparkles',
    requiresImage: true,
    category: 'Manipulation'
  },
  {
    id: 't_bg_remove',
    name: 'Matting / ISO',
    description: 'Isolate the subject.',
    promptTemplate: 'Remove the background, isolate the main subject on a pure white background, high quality clipping',
    type: 'edit',
    icon: 'Scissors',
    requiresImage: true,
    category: 'Utility'
  },
  {
    id: 't_color_grade',
    name: 'Cinematic Grade',
    description: 'Apply movie teal/orange.',
    promptTemplate: 'Apply a cinematic teal and orange color grading to this image, dramatic lighting, movie poster feel',
    type: 'edit',
    icon: 'Layers',
    requiresImage: true,
    category: 'Photography'
  },
  {
    id: 't_pixel_art',
    name: 'Pixel Art',
    description: 'Retro 8-bit style.',
    promptTemplate: 'Convert this image into retro 16-bit pixel art, arcade game style, limited color palette',
    type: 'edit',
    icon: 'Layout',
    requiresImage: true,
    category: 'Artistic'
  },
  {
    id: 't_remove_obj',
    name: 'Object Removal',
    description: 'Clean up the scene.',
    promptTemplate: 'Remove the selected object from the scene and fill the gap coherently with the background',
    type: 'edit',
    icon: 'Eraser',
    requiresImage: true,
    category: 'Utility'
  },
  {
    id: 't_material_gold',
    name: 'Make it Gold',
    description: 'Change material to gold.',
    promptTemplate: 'Change the material of the object to shiny polished gold, metallic reflections, high quality texture',
    type: 'edit',
    icon: 'Zap',
    requiresImage: true,
    category: 'Material'
  },
  {
    id: 't_material_wood',
    name: 'Make it Wood',
    description: 'Change material to wood.',
    promptTemplate: 'Change the material of the object to polished oak wood, natural wood grain texture',
    type: 'edit',
    icon: 'Zap',
    requiresImage: true,
    category: 'Material'
  },

  // --- Video Generation ---
  {
    id: 'v_cyberpunk_drive',
    name: 'Cyberpunk Drive',
    description: 'Futuristic vehicle motion.',
    promptTemplate: 'A neon hologram of a car driving at top speed through a cyberpunk city, cinematic camera movement, 4k',
    type: 'video',
    icon: 'Film',
    requiresImage: false,
    category: 'Video'
  },
  {
    id: 'v_nature_drone',
    name: 'Drone Flyover',
    description: 'Aerial nature shot.',
    promptTemplate: 'Drone footage flying over a majestic waterfall in a tropical jungle, sunlight breaking through mist, photorealistic',
    type: 'video',
    icon: 'Camera',
    requiresImage: false,
    category: 'Video'
  },
  {
    id: 'v_animate_img',
    name: 'Animate Image',
    description: 'Bring image to life.',
    promptTemplate: 'Cinematic motion, bring this scene to life with subtle camera movement and atmospheric effects',
    type: 'video',
    icon: 'Video',
    requiresImage: true,
    category: 'Video'
  },
  {
    id: 'v_zoom_in',
    name: 'Slow Zoom In',
    description: 'Dramatic zoom effect.',
    promptTemplate: 'Slow dramatic zoom in on the subject, maintaining high focus and detail, cinematic lighting',
    type: 'video',
    icon: 'Video',
    requiresImage: true,
    category: 'Video'
  }
];

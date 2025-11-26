import type { Template } from '../types'

const CATEGORY_MAP: Record<string, string> = {
  'sci-fi': 'Sci-Fi',
  '3d-art': '3D Art',
  'design': 'Design',
  'photography': 'Photography',
  'anime': 'Anime',
  'artistic': 'Artistic',
  'manipulation': 'Manipulation',
  'utility': 'Utility',
  'material': 'Material',
  'video': 'Video',
}

function mapType(dbType: string): 'create' | 'edit' | 'video' {
  switch ((dbType || '').toLowerCase()) {
    case 'single_image_edit':
    case 'single_image_generation':
      return 'edit'
    case 'video_generation':
      return 'video'
    default:
      return 'create'
  }
}

function mapIcon(category: string): string {
  switch (category) {
    case 'Design': return 'Zap'
    case 'Photography': return 'Camera'
    case 'Artistic': return 'Palette'
    case 'Sci-Fi': return 'Sparkles'
    case '3D Art': return 'BoxSelect'
    case 'Manipulation': return 'Blend'
    case 'Utility': return 'Scissors'
    case 'Material': return 'Layers'
    case 'Video': return 'Film'
    case 'Anime': return 'Sparkles'
    default: return 'Zap'
  }
}

export async function fetchNanoCanvasTemplates(): Promise<Template[]> {
  try {
    const res = await fetch('/api/templates?limit=100')
    if (!res.ok) return []
    const data = await res.json()
    if (!Array.isArray(data)) return []
    return data.map((row: any) => {
      const category = CATEGORY_MAP[row.category_id] || 'Artistic'
      const type = mapType(row.type)
      const requiresImage = type === 'edit'
      return {
        id: `db_${row.id}`,
        name: row.name || 'Template',
        description: row.description || row.prompt || '',
        promptTemplate: row.prompt || '',
        type,
        icon: mapIcon(category),
        requiresImage,
        category,
      }
    })
  } catch (e) {
    return []
  }
}


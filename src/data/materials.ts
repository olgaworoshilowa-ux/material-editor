import type { MaterialItem } from '../types'

const swatches: Array<{
  id: string
  name: string
  category: string
  color: string
  pattern: string
  slot: 'fabric' | 'frame'
}> = [
  // Chair fabric
  { id: 'f1', name: 'Linen Soft', category: 'Fabric', color: '#D4C4B0', pattern: 'fabric', slot: 'fabric' },
  { id: 'f2', name: 'Velvet Cocoa', category: 'Fabric', color: '#6B4E3D', pattern: 'fabric', slot: 'fabric' },
  { id: 'f3', name: 'Velvet Lavender', category: 'Fabric', color: '#B7A0C9', pattern: 'fabric', slot: 'fabric' },
  { id: 'f4', name: 'Boucle Cream', category: 'Fabric', color: '#E8DFD2', pattern: 'fabric', slot: 'fabric' },
  { id: 'f5', name: 'Wool Charcoal', category: 'Fabric', color: '#4A4A4A', pattern: 'fabric', slot: 'fabric' },
  { id: 'f6', name: 'Cotton Sage', category: 'Fabric', color: '#A8B5A0', pattern: 'fabric', slot: 'fabric' },
  { id: 'f7', name: 'Leather Tan', category: 'Leather', color: '#A67C52', pattern: 'leather', slot: 'fabric' },
  { id: 'f8', name: 'Leather Espresso', category: 'Leather', color: '#3E2A1F', pattern: 'leather', slot: 'fabric' },
  { id: 'f9', name: 'Suede Blush', category: 'Fabric', color: '#C9A9A6', pattern: 'fabric', slot: 'fabric' },

  // Chair frame / color material
  { id: 'w1', name: 'Walnut Dark', category: 'Wood', color: '#5C4033', pattern: 'wood', slot: 'frame' },
  { id: 'w2', name: 'Oak Natural', category: 'Wood', color: '#C4A574', pattern: 'wood', slot: 'frame' },
  { id: 'w3', name: 'Ebony', category: 'Wood', color: '#2F241C', pattern: 'wood', slot: 'frame' },
  { id: 'w4', name: 'Ash Light', category: 'Wood', color: '#D2C2A8', pattern: 'wood', slot: 'frame' },
  { id: 'w5', name: 'Teak Warm', category: 'Wood', color: '#8B5E3C', pattern: 'wood', slot: 'frame' },
  { id: 'm1', name: 'Brushed Steel', category: 'Metal', color: '#9AA0A6', pattern: 'metal', slot: 'frame' },
  { id: 'm2', name: 'Matte Black', category: 'Metal', color: '#222222', pattern: 'metal', slot: 'frame' },
  { id: 'm3', name: 'Brass Soft', category: 'Metal', color: '#C4A35A', pattern: 'metal', slot: 'frame' },
  { id: 'p1', name: 'Plastic White', category: 'Plastic', color: '#F3F1EC', pattern: 'concrete', slot: 'frame' },

  // Extra textures (visible in "All textures")
  { id: 'x1', name: 'Marble Carrara', category: 'Stone', color: '#E8E4DF', pattern: 'concrete', slot: 'frame' },
  { id: 'x2', name: 'Concrete Pale', category: 'Stone', color: '#B8B5B0', pattern: 'concrete', slot: 'frame' },
  { id: 'x3', name: 'Glass Clear', category: 'Glass', color: '#C5D8E8', pattern: 'metal', slot: 'frame' },
  { id: 'x4', name: 'Terrazzo Soft', category: 'Stone', color: '#D9CFC4', pattern: 'concrete', slot: 'fabric' },
]

function sphereGradient(color: string, pattern: string): string {
  const highlights: Record<string, string> = {
    wood: `radial-gradient(circle at 32% 28%, #ffffffaa 0%, transparent 28%),
           radial-gradient(circle at 50% 50%, ${color} 0%, ${shade(color, -35)} 70%, #1a1a1a 100%),
           repeating-linear-gradient(95deg, transparent 0 3px, #00000018 3px 4px)`,
    fabric: `radial-gradient(circle at 32% 28%, #ffffff99 0%, transparent 26%),
             radial-gradient(circle at 50% 50%, ${color} 0%, ${shade(color, -30)} 72%, #111 100%),
             repeating-linear-gradient(0deg, transparent 0 2px, #00000012 2px 3px)`,
    metal: `radial-gradient(circle at 30% 25%, #ffffffcc 0%, transparent 22%),
            radial-gradient(circle at 70% 70%, #00000055 0%, transparent 45%),
            linear-gradient(135deg, ${shade(color, 40)}, ${color}, ${shade(color, -40)})`,
    leather: `radial-gradient(circle at 32% 28%, #ffffff77 0%, transparent 26%),
              radial-gradient(circle at 50% 50%, ${color} 0%, ${shade(color, -35)} 70%, #1a1008 100%)`,
    concrete: `radial-gradient(circle at 32% 28%, #ffffff88 0%, transparent 28%),
               radial-gradient(circle at 50% 50%, ${color} 0%, ${shade(color, -20)} 75%, #333 100%)`,
  }
  return highlights[pattern] ?? highlights.fabric
}

function shade(hex: string, amount: number): string {
  const n = hex.replace('#', '')
  const num = parseInt(n, 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + amount))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount))
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

export const MATERIALS: MaterialItem[] = swatches.map((s) => ({
  id: s.id,
  name: s.name,
  category: s.category,
  color: s.color,
  slot: s.slot,
  preview: sphereGradient(s.color, s.pattern),
}))

export function materialsForSlot(slot: 'fabric' | 'frame') {
  return MATERIALS.filter((m) => m.slot === slot)
}

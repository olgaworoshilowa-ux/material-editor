export type SurfaceMode = 'texture' | 'solid'

export type TextureSettings = {
  mode: SurfaceMode
  rotation: number
  scale: number
  /** Multiplies texture color when mode is texture */
  tint: string
  /** Flat color when mode is solid */
  solidColor: string
}

export type ChairSlotId = 'fabric' | 'frame'

export type MaterialItem = {
  id: string
  name: string
  category: string
  preview: string
  color: string
  /** Which chair slot this material belongs to */
  slot: ChairSlotId
  /** Optional uploaded image URL (object URL or http) */
  mapUrl?: string
  isCustom?: boolean
  folderId?: string
}

export type TextureFolder = {
  id: string
  name: string
}

export type ChairSlot = {
  id: ChairSlotId
  label: string
  hint: string
}

export const CHAIR_SLOTS: ChairSlot[] = [
  {
    id: 'fabric',
    label: 'Fabric',
    hint: 'Seat & backrest upholstery',
  },
  {
    id: 'frame',
    label: 'Frame',
    hint: 'Legs & wood / metal color',
  },
]

export const DEFAULT_TEXTURE: TextureSettings = {
  mode: 'texture',
  rotation: 0,
  scale: 100,
  tint: '#ffffff',
  solidColor: '#B7A0C9',
}

export const SLOT_CATEGORIES: Record<ChairSlotId, string[]> = {
  fabric: ['Fabric', 'Leather'],
  frame: ['Wood', 'Metal', 'Plastic'],
}

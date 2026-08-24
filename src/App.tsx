import { useMemo, useState } from 'react'
import { BottomToolbar } from './components/BottomToolbar'
import { EditorHeader } from './components/EditorHeader'
import { MaterialLibrary } from './components/MaterialLibrary'
import { PartSelector } from './components/PartSelector'
import { TexturePanel } from './components/TexturePanel'
import { Viewport } from './components/Viewport'
import { MATERIALS, materialsForSlot } from './data/materials'
import {
  CHAIR_SLOTS,
  DEFAULT_TEXTURE,
  type ChairSlotId,
  type MaterialItem,
  type TextureFolder,
  type TextureSettings,
} from './types'
import './App.css'

const DEFAULT_FOLDER_ID = 'folder-uploads'

type EditorSnapshot = {
  selectedSlot: ChairSlotId
  fabricId: string
  frameId: string
  fabricSettings: TextureSettings
  frameSettings: TextureSettings
}

function App() {
  const fabricDefaults = materialsForSlot('fabric')
  const frameDefaults = materialsForSlot('frame')

  const [folders, setFolders] = useState<TextureFolder[]>([
    { id: DEFAULT_FOLDER_ID, name: 'Uploads' },
  ])
  const [activeFolderId, setActiveFolderId] = useState(DEFAULT_FOLDER_ID)
  const [customMaterials, setCustomMaterials] = useState<MaterialItem[]>([])
  const [recentIds, setRecentIds] = useState<string[]>([])
  const [usedIds, setUsedIds] = useState<string[]>([
    fabricDefaults[2]?.id ?? fabricDefaults[0].id,
    frameDefaults[2]?.id ?? frameDefaults[0].id,
  ])

  const [selectedSlot, setSelectedSlot] = useState<ChairSlotId>('fabric')
  const [fabricId, setFabricId] = useState(fabricDefaults[2]?.id ?? fabricDefaults[0].id)
  const [frameId, setFrameId] = useState(frameDefaults[2]?.id ?? frameDefaults[0].id)
  const [fabricSettings, setFabricSettings] = useState<TextureSettings>({
    ...DEFAULT_TEXTURE,
    solidColor: fabricDefaults[2]?.color ?? fabricDefaults[0].color,
  })
  const [frameSettings, setFrameSettings] = useState<TextureSettings>({
    ...DEFAULT_TEXTURE,
    solidColor: frameDefaults[2]?.color ?? frameDefaults[0].color,
  })
  const [past, setPast] = useState<EditorSnapshot[]>([])
  const [future, setFuture] = useState<EditorSnapshot[]>([])

  const allMaterials = useMemo(() => [...customMaterials, ...MATERIALS], [customMaterials])

  const suggestedMaterials = useMemo(
    () => allMaterials.filter((m) => m.slot === selectedSlot),
    [allMaterials, selectedSlot],
  )

  const fabricMaterial =
    allMaterials.find((m) => m.id === fabricId) ?? fabricDefaults[0]
  const frameMaterial =
    allMaterials.find((m) => m.id === frameId) ?? frameDefaults[0]

  const slotMeta = useMemo(
    () => CHAIR_SLOTS.find((s) => s.id === selectedSlot) ?? CHAIR_SLOTS[0],
    [selectedSlot],
  )

  const activeMaterial = selectedSlot === 'fabric' ? fabricMaterial : frameMaterial
  const activeSettings = selectedSlot === 'fabric' ? fabricSettings : frameSettings
  const activeId = selectedSlot === 'fabric' ? fabricId : frameId

  const snapshot = (): EditorSnapshot => ({
    selectedSlot,
    fabricId,
    frameId,
    fabricSettings,
    frameSettings,
  })

  const pushHistory = () => {
    setPast((p) => [...p.slice(-29), snapshot()])
    setFuture([])
  }

  const applySnapshot = (s: EditorSnapshot) => {
    setSelectedSlot(s.selectedSlot)
    setFabricId(s.fabricId)
    setFrameId(s.frameId)
    setFabricSettings(s.fabricSettings)
    setFrameSettings(s.frameSettings)
  }

  const trackUsage = (id: string) => {
    setRecentIds((ids) => [id, ...ids.filter((x) => x !== id)].slice(0, 9))
    setUsedIds((ids) => (ids.includes(id) ? ids : [id, ...ids].slice(0, 12)))
  }

  const setActiveSettings = (next: TextureSettings) => {
    pushHistory()
    if (selectedSlot === 'fabric') setFabricSettings(next)
    else setFrameSettings(next)
  }

  const selectMaterial = (id: string) => {
    pushHistory()
    trackUsage(id)
    const picked = allMaterials.find((m) => m.id === id)
    const nextSettings: TextureSettings = {
      ...DEFAULT_TEXTURE,
      mode: 'texture',
      solidColor: picked?.color ?? DEFAULT_TEXTURE.solidColor,
    }
    if (selectedSlot === 'fabric') {
      setFabricId(id)
      setFabricSettings(nextSettings)
    } else {
      setFrameId(id)
      setFrameSettings(nextSettings)
    }
  }

  const handleUpload = (file: File) => {
    const url = URL.createObjectURL(file)
    const item: MaterialItem = {
      id: `custom-${Date.now()}`,
      name: file.name.replace(/\.[^.]+$/, '') || 'My texture',
      category: selectedSlot === 'fabric' ? 'Fabric' : 'Wood',
      color: '#888888',
      preview: `url(${url})`,
      slot: selectedSlot,
      mapUrl: url,
      isCustom: true,
      folderId: activeFolderId,
    }
    pushHistory()
    setCustomMaterials((list) => [item, ...list])
    trackUsage(item.id)
    const nextSettings: TextureSettings = {
      ...DEFAULT_TEXTURE,
      mode: 'texture',
      solidColor: item.color,
    }
    if (selectedSlot === 'fabric') {
      setFabricId(item.id)
      setFabricSettings(nextSettings)
    } else {
      setFrameId(item.id)
      setFrameSettings(nextSettings)
    }
  }

  const handleCreateFolder = (name: string) => {
    const id = `folder-${Date.now()}`
    setFolders((list) => [...list, { id, name }])
    setActiveFolderId(id)
  }

  const undo = () => {
    setPast((p) => {
      if (!p.length) return p
      const prev = p[p.length - 1]
      setFuture((f) => [snapshot(), ...f])
      applySnapshot(prev)
      return p.slice(0, -1)
    })
  }

  const redo = () => {
    setFuture((f) => {
      if (!f.length) return f
      const [next, ...rest] = f
      setPast((p) => [...p, snapshot()])
      applySnapshot(next)
      return rest
    })
  }

  return (
    <div className="app">
      <div className="app__body">
        <Viewport
          fabricMaterial={fabricMaterial}
          frameMaterial={frameMaterial}
          fabricSettings={fabricSettings}
          frameSettings={frameSettings}
          selectedSlot={selectedSlot}
          onSelectSlot={(slot) => {
            pushHistory()
            setSelectedSlot(slot)
          }}
        />

        <EditorHeader
          objectName="Chair fluffy fluff"
          onBack={() => window.history.back()}
          onSave={() =>
            window.alert(
              `Saved\nFabric: ${fabricMaterial.name}\nFrame: ${frameMaterial.name}`,
            )
          }
          onEyedropper={() => window.alert('Eyedropper: click a material in the scene')}
        />

        <MaterialLibrary
          key={selectedSlot}
          slot={selectedSlot}
          suggestedMaterials={suggestedMaterials}
          allMaterials={allMaterials}
          customMaterials={customMaterials}
          folders={folders}
          selectedId={activeId}
          recentIds={recentIds}
          usedIds={usedIds}
          activeFolderId={activeFolderId}
          onSelect={selectMaterial}
          onUpload={handleUpload}
          onCreateFolder={handleCreateFolder}
          onSelectFolder={setActiveFolderId}
        />

        <PartSelector
          selectedSlot={selectedSlot}
          onSelect={(slot) => {
            pushHistory()
            setSelectedSlot(slot)
          }}
          fabricPreview={
            fabricSettings.mode === 'solid'
              ? fabricSettings.solidColor
              : fabricMaterial.mapUrl
                ? `url(${fabricMaterial.mapUrl}) center / cover`
                : fabricMaterial.preview
          }
          framePreview={
            frameSettings.mode === 'solid'
              ? frameSettings.solidColor
              : frameMaterial.mapUrl
                ? `url(${frameMaterial.mapUrl}) center / cover`
                : frameMaterial.preview
          }
        />

        <TexturePanel
          material={activeMaterial}
          settings={activeSettings}
          selectedSlot={slotMeta}
          onChange={setActiveSettings}
          onResetMaterial={() => {
            pushHistory()
            if (selectedSlot === 'fabric') {
              setFabricId(fabricDefaults[0].id)
              setFabricSettings({
                ...DEFAULT_TEXTURE,
                solidColor: fabricDefaults[0].color,
              })
            } else {
              setFrameId(frameDefaults[0].id)
              setFrameSettings({
                ...DEFAULT_TEXTURE,
                solidColor: frameDefaults[0].color,
              })
            }
          }}
        />

        <BottomToolbar
          onUndo={undo}
          onRedo={redo}
          canUndo={past.length > 0}
          canRedo={future.length > 0}
        />
      </div>
    </div>
  )
}

export default App

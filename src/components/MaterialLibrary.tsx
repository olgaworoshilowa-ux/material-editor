import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChairSlotId, MaterialItem, TextureFolder } from '../types'
import { SLOT_CATEGORIES } from '../types'
import './MaterialLibrary.css'

type LibraryNav =
  | 'for-item'
  | 'my-textures'
  | 'project'
  | 'recent'
  | 'library'

type MaterialLibraryProps = {
  slot: ChairSlotId
  suggestedMaterials: MaterialItem[]
  allMaterials: MaterialItem[]
  customMaterials: MaterialItem[]
  folders: TextureFolder[]
  selectedId: string
  recentIds: string[]
  usedIds: string[]
  activeFolderId: string
  onSelect: (id: string) => void
  onUpload: (file: File) => void
  onCreateFolder: (name: string) => void
  onSelectFolder: (folderId: string) => void
}

const NAV: Array<{ id: LibraryNav; label: string }> = [
  { id: 'for-item', label: 'For this item' },
  { id: 'my-textures', label: 'My textures' },
  { id: 'project', label: 'Project' },
  { id: 'recent', label: 'Recent' },
  { id: 'library', label: 'Library' },
]

const LIBRARY_CATEGORIES = [
  'Fabric',
  'Leather',
  'Wood',
  'Metal',
  'Plastic',
  'Stone',
  'Glass',
] as const

function MaterialThumb({
  material,
  selected,
  onClick,
}: {
  material: MaterialItem
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={`material-card ${selected ? 'is-selected' : ''}`}
      onClick={onClick}
    >
      <div
        className="material-card__preview"
        style={
          material.mapUrl
            ? {
                backgroundImage: `url(${material.mapUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : { background: material.preview }
        }
      >
        <span className="material-card__badge">{material.isCustom ? 'YOU' : 'PBR'}</span>
      </div>
      <span className="material-card__name">{material.name}</span>
    </button>
  )
}

export function MaterialLibrary({
  slot,
  suggestedMaterials,
  allMaterials,
  customMaterials,
  folders: _folders,
  selectedId,
  recentIds,
  usedIds,
  activeFolderId,
  onSelect,
  onUpload,
  onCreateFolder,
  onSelectFolder: _onSelectFolder,
}: MaterialLibraryProps) {
  const [nav, setNav] = useState<LibraryNav>('for-item')
  const [category, setCategory] = useState<string>('All')
  const [query, setQuery] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setNav('for-item')
    setCategory('All')
    setQuery('')
  }, [slot])

  const byId = useMemo(() => {
    const map = new Map<string, MaterialItem>()
    for (const m of allMaterials) map.set(m.id, m)
    return map
  }, [allMaterials])

  const recentMaterials = useMemo(
    () => recentIds.map((id) => byId.get(id)).filter(Boolean) as MaterialItem[],
    [recentIds, byId],
  )

  const projectMaterials = useMemo(
    () => usedIds.map((id) => byId.get(id)).filter(Boolean) as MaterialItem[],
    [usedIds, byId],
  )

  const folderTextures = useMemo(
    () => customMaterials.filter((m) => m.folderId === activeFolderId),
    [customMaterials, activeFolderId],
  )

  const itemCategories = SLOT_CATEGORIES[slot]

  const forItemList = useMemo(() => {
    return suggestedMaterials.filter((m) => {
      if (m.isCustom) return false
      const catOk = category === 'All' || m.category === category
      const q = query.trim().toLowerCase()
      return catOk && (!q || m.name.toLowerCase().includes(q))
    })
  }, [suggestedMaterials, category, query])

  const libraryList = useMemo(() => {
    return allMaterials.filter((m) => {
      if (m.isCustom) return false
      const catOk = category === 'All' || m.category === category
      const q = query.trim().toLowerCase()
      return catOk && (!q || m.name.toLowerCase().includes(q))
    })
  }, [allMaterials, category, query])

  const title = slot === 'fabric' ? 'Chair · Fabric' : 'Chair · Frame'

  const contentTitle =
    nav === 'for-item'
      ? 'For this item'
      : nav === 'my-textures'
        ? 'My textures'
        : nav === 'project'
          ? 'Project'
          : nav === 'recent'
            ? 'Recent'
            : 'Library'

  const showFilters = nav === 'for-item' || nav === 'library'
  const filterCats = nav === 'for-item' ? itemCategories : [...LIBRARY_CATEGORIES]

  const gridItems =
    nav === 'for-item'
      ? forItemList
      : nav === 'library'
        ? libraryList
        : nav === 'recent'
          ? recentMaterials
          : nav === 'project'
            ? projectMaterials
            : folderTextures

  return (
    <aside className="material-library" aria-label={title}>
      <div className="material-library__header">
        <h2>{title}</h2>
          <p className="material-library__subtitle">
            {slot === 'fabric' ? 'Chair upholstery' : 'Legs & frame material'}
          </p>
      </div>

      <div className="material-library__shell">
        <nav className="material-library__nav" aria-label="Library sections">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={nav === item.id ? 'is-active' : ''}
              onClick={() => {
                setNav(item.id)
                setCategory('All')
                setQuery('')
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="material-library__content">
          <div className="material-library__content-head">
            <h3>{contentTitle}</h3>
          </div>

          {nav === 'my-textures' && (
            <section className="own-textures">
              <p className="own-textures__desc">
                Upload images to use them on surfaces in your project
              </p>
              <div className="own-textures__actions">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) onUpload(file)
                    e.target.value = ''
                  }}
                />
                <button
                  type="button"
                  className="own-textures__upload"
                  onClick={() => fileRef.current?.click()}
                >
                  Upload texture
                </button>
                <button
                  type="button"
                  className="own-textures__folder"
                  onClick={() => {
                    const name = window.prompt('Folder name', 'New folder')
                    if (name?.trim()) onCreateFolder(name.trim())
                  }}
                >
                  + New folder
                </button>
              </div>
            </section>
          )}

          {showFilters && (
            <>
              <div className="material-library__search">
                <input
                  type="search"
                  placeholder="Search…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="material-library__categories">
                {['All', ...filterCats].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`material-library__cat ${category === cat ? 'is-active' : ''}`}
                    onClick={() => setCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="material-library__scroll">
            {gridItems.length > 0 && (
              <div className="material-library__grid">
                {gridItems.map((m) => (
                  <MaterialThumb
                    key={m.id}
                    material={m}
                    selected={selectedId === m.id}
                    onClick={() => onSelect(m.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}

import { SliderRow } from './SliderRow'
import type { ChairSlot, MaterialItem, SurfaceMode, TextureSettings } from '../types'
import { DEFAULT_TEXTURE } from '../types'
import './TexturePanel.css'

type TexturePanelProps = {
  material: MaterialItem
  settings: TextureSettings
  selectedSlot: ChairSlot
  onChange: (settings: TextureSettings) => void
  onResetMaterial?: () => void
}

export function TexturePanel({
  material,
  settings,
  selectedSlot,
  onChange,
  onResetMaterial,
}: TexturePanelProps) {
  const setMode = (mode: SurfaceMode) => {
    if (mode === settings.mode) return
    if (mode === 'solid') {
      onChange({
        ...settings,
        mode,
        solidColor: settings.solidColor || material.color,
      })
      return
    }
    onChange({ ...settings, mode })
  }

  return (
    <aside className="texture-panel" aria-label="Texture properties">
      <div className="texture-panel__selection">
        <span className="texture-panel__selection-label">Chair texture</span>
        <strong className="texture-panel__selection-name">
          {selectedSlot.label}
        </strong>
        <span className="texture-panel__selection-note">{selectedSlot.hint}</span>
      </div>

      <section className="texture-section">
        <div className="texture-section__header">
          <span className="texture-section__title">Surface</span>
        </div>
        <div className="texture-section__body">
          <div className="texture-panel__mode" role="tablist" aria-label="Surface type">
            <button
              type="button"
              role="tab"
              aria-selected={settings.mode === 'texture'}
              className={
                settings.mode === 'texture'
                  ? 'texture-panel__mode-btn is-active'
                  : 'texture-panel__mode-btn'
              }
              onClick={() => setMode('texture')}
            >
              Texture
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={settings.mode === 'solid'}
              className={
                settings.mode === 'solid'
                  ? 'texture-panel__mode-btn is-active'
                  : 'texture-panel__mode-btn'
              }
              onClick={() => setMode('solid')}
            >
              Solid
            </button>
          </div>
        </div>
      </section>

      {settings.mode === 'texture' ? (
        <section className="texture-section">
          <div className="texture-section__header">
            <span className="texture-section__title">Material</span>
            {onResetMaterial && (
              <button type="button" className="texture-section__reset" onClick={onResetMaterial}>
                Reset
              </button>
            )}
          </div>
          <div className="texture-section__body">
            <div className="texture-panel__material">
              <div
                className="texture-panel__swatch"
                style={
                  material.mapUrl
                    ? {
                        backgroundImage: `url(${material.mapUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }
                    : { background: material.preview }
                }
                title={material.name}
              />
              <span className="texture-panel__material-name">{material.name}</span>
            </div>
          </div>
        </section>
      ) : (
        <section className="texture-section">
          <div className="texture-section__header">
            <span className="texture-section__title">Color</span>
            <button
              type="button"
              className="texture-section__reset"
              onClick={() =>
                onChange({ ...settings, solidColor: material.color })
              }
            >
              Reset
            </button>
          </div>
          <div className="texture-section__body">
            <div className="texture-panel__material">
              <div
                className="texture-panel__swatch"
                style={{ background: settings.solidColor }}
                title={settings.solidColor}
              />
              <label className="texture-panel__tint">
                <span>Solid color</span>
                <div className="texture-panel__tint-controls">
                  <input
                    type="color"
                    value={settings.solidColor}
                    onChange={(e) =>
                      onChange({ ...settings, solidColor: e.target.value })
                    }
                    aria-label="Solid color"
                  />
                  <input
                    className="texture-panel__tint-hex"
                    type="text"
                    value={settings.solidColor}
                    onChange={(e) => {
                      const solidColor = e.target.value
                      if (/^#[0-9a-fA-F]{6}$/.test(solidColor)) {
                        onChange({ ...settings, solidColor })
                      }
                    }}
                  />
                </div>
              </label>
            </div>
          </div>
        </section>
      )}

      {settings.mode === 'texture' && (
        <section className="texture-section">
          <div className="texture-section__header">
            <span className="texture-section__title">Settings</span>
            <button
              type="button"
              className="texture-section__reset"
              onClick={() =>
                onChange({
                  ...DEFAULT_TEXTURE,
                  mode: 'texture',
                  tint: settings.tint,
                  solidColor: settings.solidColor,
                })
              }
            >
              Reset
            </button>
          </div>
          <div className="texture-section__body">
            <div className="texture-section__fields">
              <SliderRow
                label="Rotation"
                value={settings.rotation}
                min={0}
                max={360}
                unit="°"
                onChange={(rotation) => onChange({ ...settings, rotation })}
              />
              <SliderRow
                label="Scale"
                value={settings.scale}
                min={20}
                max={300}
                unit="%"
                onChange={(scale) => onChange({ ...settings, scale })}
              />
              <label className="texture-panel__tint">
                <span>Tint</span>
                <div className="texture-panel__tint-controls">
                  <input
                    type="color"
                    value={settings.tint}
                    onChange={(e) => onChange({ ...settings, tint: e.target.value })}
                    aria-label="Tint color"
                  />
                  <input
                    className="texture-panel__tint-hex"
                    type="text"
                    value={settings.tint}
                    onChange={(e) => {
                      const tint = e.target.value
                      if (/^#[0-9a-fA-F]{6}$/.test(tint)) {
                        onChange({ ...settings, tint })
                      }
                    }}
                  />
                </div>
              </label>
            </div>
          </div>
        </section>
      )}
    </aside>
  )
}

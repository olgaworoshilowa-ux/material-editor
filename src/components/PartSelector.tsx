import { CHAIR_SLOTS, type ChairSlotId } from '../types'
import './PartSelector.css'

type PartSelectorProps = {
  selectedSlot: ChairSlotId
  onSelect: (slot: ChairSlotId) => void
  fabricPreview: string
  framePreview: string
}

export function PartSelector({
  selectedSlot,
  onSelect,
  fabricPreview,
  framePreview,
}: PartSelectorProps) {
  const previews: Record<ChairSlotId, string> = {
    fabric: fabricPreview,
    frame: framePreview,
  }

  return (
    <div className="part-selector" aria-label="Chair textures">
      <span className="part-selector__label">Chair textures</span>
      <div className="part-selector__list">
        {CHAIR_SLOTS.map((slot) => (
          <button
            key={slot.id}
            type="button"
            className={`part-selector__item ${selectedSlot === slot.id ? 'is-active' : ''}`}
            title={slot.hint}
            onClick={() => onSelect(slot.id)}
          >
            <span
              className="part-selector__swatch"
              style={{ background: previews[slot.id] }}
            />
            <span className="part-selector__text">
              <span className="part-selector__name">
                {slot.label}
              </span>
              <span className="part-selector__hint">{slot.hint}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

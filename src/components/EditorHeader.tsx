import { ArrowLeft, PaintRoller, Pipette } from 'lucide-react'
import './EditorHeader.css'

type EditorHeaderProps = {
  objectName?: string
  onBack?: () => void
  onSave?: () => void
  onEyedropper?: () => void
}

export function EditorHeader({
  objectName = 'Chair fluffy fluff',
  onBack,
  onSave,
  onEyedropper,
}: EditorHeaderProps) {
  return (
    <header className="texture-header" aria-label="Texture editor">
      <div className="texture-header__left">
        <div className="texture-header__nav-pill">
          <button
            type="button"
            className="texture-header__back"
            onClick={onBack}
            aria-label="Back"
            title="Back"
          >
            <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
          </button>
          <span className="texture-header__divider" aria-hidden="true" />
          <span className="texture-header__roller" aria-hidden="true">
            <PaintRoller size={18} strokeWidth={2} />
          </span>
          <span className="texture-header__title">
            Texture editor: <strong>{objectName}</strong>
          </span>
        </div>

        <button
          type="button"
          className="texture-header__eyedropper"
          onClick={onEyedropper}
          aria-label="Eyedropper"
          title="Eyedropper"
        >
          <Pipette size={16} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>

      <button type="button" className="texture-header__save" onClick={onSave}>
        Save changes
      </button>
    </header>
  )
}

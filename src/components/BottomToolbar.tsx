import { Redo2, Undo2 } from 'lucide-react'
import './BottomToolbar.css'

type BottomToolbarProps = {
  onUndo?: () => void
  onRedo?: () => void
  canUndo?: boolean
  canRedo?: boolean
}

export function BottomToolbar({
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}: BottomToolbarProps) {
  return (
    <div className="bottom-toolbar" role="toolbar" aria-label="History">
      <button
        type="button"
        className="bottom-toolbar__btn"
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo"
        aria-label="Undo"
      >
        <Undo2 size={18} strokeWidth={2} aria-hidden="true" />
      </button>
      <button
        type="button"
        className="bottom-toolbar__btn"
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo"
        aria-label="Redo"
      >
        <Redo2 size={18} strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  )
}

import { useId, type CSSProperties } from 'react'
import './SliderRow.css'

type SliderRowProps = {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit: string
  onChange: (value: number) => void
}

export function SliderRow({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
}: SliderRowProps) {
  const id = useId()
  const percent = ((value - min) / (max - min)) * 100

  return (
    <div className="slider-row">
      <label className="slider-row__label" htmlFor={id}>
        {label}
      </label>
      <div className="slider-row__controls">
        <input
          id={id}
          className="slider-row__range"
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          style={{ '--fill': `${percent}%` } as CSSProperties}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <div className="slider-row__input-wrap">
          <input
            className="slider-row__number"
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => {
              const next = Number(e.target.value)
              if (Number.isNaN(next)) return
              onChange(Math.min(max, Math.max(min, next)))
            }}
          />
          <span className="slider-row__unit">{unit}</span>
        </div>
      </div>
    </div>
  )
}

import { Minus, Plus } from 'lucide-react'

type NumberStepperProps = {
  value: string
  onChange: (value: string) => void
  min?: number
  className?: string
}

export default function NumberStepper({ value, onChange, min = 1, className = '' }: NumberStepperProps) {
  const numericValue = Number(value)

  function updateValue(nextValue: number) {
    onChange(String(Math.max(min, nextValue)))
  }

  return (
    <div className={`w-full border border-(--app-border) rounded-lg overflow-hidden flex items-center bg-transparent text-sm transition hover:border-(--app-accent) focus-within:border-(--app-accent) ${className}`}>
      <button
        type="button"
        onClick={() => updateValue((Number.isFinite(numericValue) ? numericValue : min) - 1)}
        className="h-10 w-10 shrink-0 flex items-center justify-center border-r border-(--app-border-soft) bg-(--app-surface-soft) text-(--app-text-muted) hover:bg-(--app-surface-strong) hover:text-(--app-text) transition cursor-pointer"
      >
        <Minus className="size-4" />
      </button>

      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, ''))}
        onBlur={() => {
          if (!value || Number(value) < min) {
            onChange(String(min))
          }
        }}
        className="h-10 min-w-0 flex-1 bg-transparent px-2 text-center font-medium text-(--app-text) focus:outline-0"
      />

      <button
        type="button"
        onClick={() => updateValue((Number.isFinite(numericValue) ? numericValue : min) + 1)}
        className="h-10 w-10 shrink-0 flex items-center justify-center border-l border-(--app-border-soft) bg-(--app-surface-soft) text-(--app-text-muted) hover:bg-(--app-surface-strong) hover:text-(--app-text) transition cursor-pointer"
      >
        <Plus className="size-4" />
      </button>
    </div>
  )
}

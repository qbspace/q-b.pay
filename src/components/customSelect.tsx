import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type CustomSelectOption = {
  value: string
  label: string
}

type CustomSelectProps = {
  value: string
  options: CustomSelectOption[]
  onChange: (value: string) => void
  className?: string
}

export default function CustomSelect({ value, options, onChange, className = '' }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectRef = useRef<HTMLDivElement>(null)
  const selectedOption = options.find((option) => option.value === value)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!selectRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className={`w-full border rounded-lg p-2 px-3 flex items-center justify-between gap-2 text-left transition cursor-pointer focus:outline-0 ${isOpen ? 'border-(--app-accent) bg-(--app-surface-strong)' : 'border-(--app-border) hover:border-(--app-accent) bg-transparent'}`}
      >
        <span className="truncate">{selectedOption?.label || value}</span>
        <ChevronDown className={`size-4 shrink-0 text-(--app-text-muted) transition ${isOpen ? 'rotate-180 text-(--app-accent)' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-100 overflow-hidden rounded-lg border border-(--app-border) bg-(--app-surface) shadow-xl">
          {options.map((option) => {
            const isSelected = option.value === value

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between gap-2 transition cursor-pointer ${isSelected ? 'bg-(--app-accent)/15 text-(--app-text)' : 'text-(--app-text-soft) hover:bg-(--app-surface-strong) hover:text-(--app-text)'}`}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <Check className="size-4 shrink-0 text-(--app-accent)" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

import {
  useCallback,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'

export type VirtualKeyTone = 'accent' | 'default' | 'muted' | 'positive' | 'warning'

export type VirtualKeyboardAction = {
  value: string
  label: ReactNode
  accessibleLabel?: string
}

export type VirtualKeyboardProps = {
  onKey: (value: string) => void
  leadingAction?: VirtualKeyboardAction
  trailingAction?: VirtualKeyboardAction
  tones?: Readonly<Record<string, VirtualKeyTone>>
  label?: string
}

const NO_TONES: Readonly<Record<string, VirtualKeyTone>> = {}
const LETTER_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
] as const

type Key = {
  value: string
  label: ReactNode
  accessibleLabel?: string
  action?: boolean
}

function keyClasses(tone: VirtualKeyTone, active: boolean, action = false) {
  return [
    'relative grid h-14 min-w-0 place-items-center rounded-md px-0 text-sm font-semibold',
    'select-none transition-[transform,background-color] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2',
    action ? 'flex-[1.35]' : 'flex-1',
    tone === 'default' && 'bg-keyboard text-keyboard-foreground hover:bg-keyboard-hover',
    tone === 'accent' && 'bg-primary text-primary-foreground hover:bg-primary/90',
    tone === 'muted' &&
      'bg-keyboard-muted text-keyboard-muted-foreground hover:bg-keyboard-muted/90',
    tone === 'positive' &&
      'bg-keyboard-positive text-keyboard-positive-foreground hover:bg-keyboard-positive/90',
    tone === 'warning' &&
      'bg-keyboard-warning text-keyboard-warning-foreground hover:bg-keyboard-warning/90',
    active && 'z-10 scale-95',
  ]
    .filter(Boolean)
    .join(' ')
}

export function VirtualKeyboard({
  onKey,
  leadingAction,
  trailingAction,
  tones = NO_TONES,
  label = 'Keyboard',
}: VirtualKeyboardProps) {
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const activePointer = useRef<number | null>(null)

  const keyAtPoint = useCallback((clientX: number, clientY: number) => {
    const target = document.elementFromPoint(clientX, clientY)
    return target?.closest<HTMLElement>('[data-virtual-key]')?.dataset.virtualKey ?? null
  }, [])

  const handlePointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.button !== 0) return
    const key =
      event.target instanceof Element
        ? event.target.closest<HTMLElement>('[data-virtual-key]')?.dataset.virtualKey
        : undefined
    if (!key) return
    event.preventDefault()
    activePointer.current = event.pointerId
    event.currentTarget.setPointerCapture(event.pointerId)
    setActiveKey(key)
  }, [])

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (activePointer.current !== event.pointerId) return
      setActiveKey(keyAtPoint(event.clientX, event.clientY))
    },
    [keyAtPoint],
  )

  const finishPointer = useCallback(
    (event: PointerEvent<HTMLDivElement>, commit: boolean) => {
      if (activePointer.current !== event.pointerId) return
      const key = keyAtPoint(event.clientX, event.clientY)
      activePointer.current = null
      setActiveKey(null)
      if (event.currentTarget.hasPointerCapture(event.pointerId))
        event.currentTarget.releasePointerCapture(event.pointerId)
      if (commit && key) onKey(key)
    },
    [keyAtPoint, onKey],
  )

  const handlePointerUp = useCallback(
    (event: PointerEvent<HTMLDivElement>) => finishPointer(event, true),
    [finishPointer],
  )
  const handlePointerCancel = useCallback(
    (event: PointerEvent<HTMLDivElement>) => finishPointer(event, false),
    [finishPointer],
  )
  const handleAccessibleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (event.detail !== 0) return
      const key = event.currentTarget.dataset.virtualKey
      if (key) onKey(key)
    },
    [onKey],
  )
  const rows: readonly (readonly Key[])[] = [
    LETTER_ROWS[0].map((value) => ({ value, label: value })),
    LETTER_ROWS[1].map((value) => ({ value, label: value })),
    [
      ...(leadingAction ? [{ ...leadingAction, action: true }] : []),
      ...LETTER_ROWS[2].map((value) => ({ value, label: value })),
      ...(trailingAction ? [{ ...trailingAction, action: true }] : []),
    ],
  ]

  return (
    <div
      className="mx-auto grid w-full max-w-md touch-none gap-1.5"
      aria-label={label}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      {rows.map((row) => (
        <div
          key={row.map((key) => key.value).join('\u0000')}
          className="flex justify-center gap-1.5"
        >
          {row.map((key) => {
            const active = activeKey === key.value
            return (
              <button
                key={key.value}
                type="button"
                data-virtual-key={key.value}
                onClick={handleAccessibleClick}
                className={keyClasses(tones[key.value] ?? 'default', active, key.action)}
                aria-label={key.accessibleLabel}
              >
                {active && key.value.length === 1 ? (
                  <span className="pointer-events-none absolute bottom-[calc(100%+.4rem)] grid size-11 place-items-center rounded-lg border bg-card text-lg text-card-foreground shadow-lg">
                    {key.label}
                  </span>
                ) : null}
                {key.label}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}

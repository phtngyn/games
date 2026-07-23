export function WordleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="15" fill="currentColor" />
      <path
        d="M14 17h7l4.5 20L30 21h4l4.5 16L43 17h7l-7.5 29h-7L32 33.5 28.5 46h-7L14 17Z"
        className="fill-primary-foreground"
      />
      <rect x="17" y="51" width="8" height="4" rx="2" className="fill-game-positive" />
      <rect x="28" y="51" width="8" height="4" rx="2" className="fill-game-warning" />
      <rect x="39" y="51" width="8" height="4" rx="2" className="fill-game-muted" />
    </svg>
  )
}

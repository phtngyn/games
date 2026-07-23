export function CrosswordLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 96 96"
      aria-hidden="true"
      shapeRendering="geometricPrecision"
    >
      <rect width="96" height="96" rx="20" className="fill-zinc-950" />
      <g>
        <path
          d="M20 7h13v26H7V20C7 12.82 12.82 7 20 7ZM63 7h13c7.18 0 13 5.82 13 13v13H63V7ZM7 63h26v26H20c-7.18 0-13-5.82-13-13V63Z"
          className="fill-zinc-50"
        />
        <path
          d="M35 7h26v26H35zM7 35h26v26H7zM63 35h26v26H63zM35 63h26v26H35z"
          className="fill-game-active"
        />
        <path d="M35 35h26v26H35z" className="fill-game-focus" />
        <path d="M63 63h26v13c0 7.18-5.82 13-13 13H63V63Z" className="fill-zinc-800" />
      </g>
    </svg>
  )
}

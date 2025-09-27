export function RootstockLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <div className={`${className} relative`}>
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="rootstock-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F7931A" />
            <stop offset="50%" stopColor="#E67E22" />
            <stop offset="100%" stopColor="#D35400" />
          </linearGradient>
          <linearGradient id="rootstock-accent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2C3E50" />
            <stop offset="100%" stopColor="#34495E" />
          </linearGradient>
        </defs>
        <circle cx="16" cy="16" r="14" fill="url(#rootstock-gradient)" />
        <path d="M8 12 L16 8 L24 12 L20 16 L16 20 L12 16 Z" fill="white" fillOpacity="0.95" />
        <circle cx="16" cy="16" r="3" fill="url(#rootstock-accent)" />
        <text x="16" y="18" textAnchor="middle" fontSize="4" fill="white" fontWeight="bold" fontFamily="monospace">₿</text>
      </svg>
    </div>
  )
}

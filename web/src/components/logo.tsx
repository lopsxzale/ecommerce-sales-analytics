/** Marca do site: mesmo desenho do favicon (src/app/icon.svg). */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className="shrink-0">
      <defs>
        <linearGradient id="logo-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFD94A" />
          <stop offset="1" stopColor="#E0A400" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#logo-bg)" />
      <rect x="13" y="35" width="10" height="16" rx="3" fill="#0B0B0B" fillOpacity=".55" />
      <rect x="27" y="25" width="10" height="26" rx="3" fill="#0B0B0B" fillOpacity=".78" />
      <rect x="41" y="13" width="10" height="38" rx="3" fill="#0B0B0B" />
    </svg>
  );
}

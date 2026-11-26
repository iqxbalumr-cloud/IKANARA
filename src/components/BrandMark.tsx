export function BrandMark({ dark = false, compact = false }: { dark?: boolean; compact?: boolean }) {
  return (
    <div className="inline-flex items-center gap-2.5 shrink-0 select-none">
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect
          width="32"
          height="32"
          rx="8"
          fill={dark ? '#FFFFFF' : '#0F172A'}
        />
        <path
          d="M7 16.2C10.5 11.8 15.8 10.6 21.2 13.4C22.9 14.3 24.4 13.6 25.5 12.2C24.8 14.8 24.8 17.6 25.5 20.2C24.4 18.8 22.9 18.1 21.2 19C15.8 21.8 10.5 20.6 7 16.2Z"
          stroke={dark ? '#0F172A' : '#38BDF8'}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <circle
          cx="12.2"
          cy="15.8"
          r="1.2"
          fill={dark ? '#0F172A' : '#FFFFFF'}
        />
        <path
          d="M7 23.5C10.5 22 14.5 22 18 23.5C21 24.8 23.5 24.6 25.5 23.5"
          stroke={dark ? '#0284C7' : '#38BDF8'}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      {!compact && (
        <span
          className={`text-lg font-bold tracking-tight whitespace-nowrap ${
            dark ? 'text-white' : 'text-slate-900'
          }`}
        >
          IKANARA
        </span>
      )}
    </div>
  );
}

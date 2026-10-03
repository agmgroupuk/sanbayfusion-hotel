export function HeroVisual() {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto aspect-square w-full max-w-[34rem]"
    >
      <div className="absolute inset-[7%] rounded-full border border-gold/10" />
      <div className="home-orbit absolute inset-[15%] rounded-full border border-dashed border-gold/20" />
      <div className="absolute inset-[24%] rounded-full border border-gold/15" />

      <svg
        viewBox="0 0 500 500"
        className="absolute inset-0 size-full"
        fill="none"
      >
        <defs>
          <linearGradient id="home-network-gold" x1="90" y1="90" x2="410" y2="410">
            <stop stopColor="#f4d58d" stopOpacity=".15" />
            <stop offset=".52" stopColor="#d6b25e" stopOpacity=".82" />
            <stop offset="1" stopColor="#f4d58d" stopOpacity=".15" />
          </linearGradient>
        </defs>
        <path
          d="M100 180 190 125 305 153 390 230 342 346 220 376 112 302 100 180Z"
          stroke="url(#home-network-gold)"
          strokeWidth="1.5"
        />
        <path d="m100 180 112 196 93-223M190 125l152 221M305 153l85 77-170 146M112 302l278-72" stroke="url(#home-network-gold)" strokeOpacity=".42" />
        {[["100", "180"], ["190", "125"], ["305", "153"], ["390", "230"], ["342", "346"], ["220", "376"], ["112", "302"]].map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4" fill="#e5c477" />
        ))}
        <circle cx="305" cy="153" r="11" stroke="#e5c477" strokeOpacity=".55" />
        <circle cx="112" cy="302" r="10" stroke="#e5c477" strokeOpacity=".45" />
      </svg>

      <div className="home-core-glow absolute inset-[34%] flex flex-col items-center justify-center rounded-full border border-gold/35 bg-[radial-gradient(circle_at_35%_25%,rgba(226,193,117,0.18),rgba(20,18,14,0.96)_68%)] shadow-[0_0_90px_rgba(207,170,95,0.13)]">
        <span className="font-display text-4xl font-medium tracking-tight text-gold sm:text-5xl">
          SF
        </span>
        <span className="mt-2 text-[0.6rem] uppercase tracking-[0.28em] text-foreground/65">
          Digital core
        </span>
      </div>

      <div className="absolute right-[2%] top-[18%] rounded-full border border-gold/20 bg-background/90 px-3 py-2 text-[0.6rem] uppercase tracking-[0.16em] text-gold shadow-lg shadow-black/20 sm:right-[5%] sm:px-4 sm:text-xs">
        AI systems
      </div>
      <div className="absolute bottom-[24%] left-[1%] rounded-full border border-gold/20 bg-background/90 px-3 py-2 text-[0.6rem] uppercase tracking-[0.16em] text-foreground/80 shadow-lg shadow-black/20 sm:left-[4%] sm:px-4 sm:text-xs">
        Software
      </div>
      <div className="absolute bottom-[12%] right-[5%] rounded-full border border-gold/20 bg-background/90 px-3 py-2 text-[0.6rem] uppercase tracking-[0.16em] text-foreground/80 shadow-lg shadow-black/20 sm:px-4 sm:text-xs">
        Global platform
      </div>
    </div>
  );
}

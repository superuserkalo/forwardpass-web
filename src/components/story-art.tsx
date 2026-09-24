function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

const ACCENTS = ["#e8e4da", "#d8a24a", "#c2703c", "#7d8f7a", "#9b7fb8", "#5f83a8"];

export function StoryArt({ seed, className }: { seed: string; className?: string }) {
  const hash = hashSeed(seed);
  const accent = ACCENTS[hash % ACCENTS.length] ?? "#e8e4da";
  const rotation = (hash >> 3) % 360;
  const rings = 3 + (hash % 3);
  const drift = 30 + (hash >> 5) % 40;

  return (
    <svg
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id={`art-${hash}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1b1b1b" />
          <stop offset="100%" stopColor="#0c0c0c" />
        </linearGradient>
        <radialGradient id={`glow-${hash}`} cx="0.72" cy="0.3" r="0.7">
          <stop offset="0%" stopColor={accent} stopOpacity="0.32" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="180" fill={`url(#art-${hash})`} />
      <rect width="320" height="180" fill={`url(#glow-${hash})`} />
      <g transform={`rotate(${rotation} 160 90)`} fill="none" stroke={accent} strokeOpacity="0.5">
        {Array.from({ length: rings }, (_, ring) => (
          <circle
            key={ring}
            cx={160 - drift}
            cy={90 + ring * 6}
            r={26 + ring * 22}
            strokeWidth={ring === 0 ? 1.6 : 0.8}
            strokeOpacity={0.65 - ring * 0.11}
          />
        ))}
        <path d={`M0 ${120 + (hash % 30)} Q 160 ${40 + (hash % 50)} 320 ${110 + (hash % 40)}`} strokeWidth="1" strokeOpacity="0.35" />
      </g>
      <g fill={accent}>
        <circle cx={236 - (hash % 40)} cy={44 + (hash % 30)} r="3.2" fillOpacity="0.9" />
        <rect x={252 + (hash % 30) - 15} y={126 - (hash % 24)} width="5" height="5" fillOpacity="0.55" transform={`rotate(${rotation} 254 126)`} />
      </g>
    </svg>
  );
}

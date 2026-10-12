/** Mihenk taşı: koyu taş üzerinde altın sürtme izi */
export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect x="2" y="4" width="28" height="24" rx="5" fill="#3A4145" />
      <path d="M8 21 C12 17, 18 14, 24 11" stroke="#D9B45A" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  );
}

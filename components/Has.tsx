import { fmtGram } from '@/lib/labels';

/** Net has bakiyesi: pozitif = müşteri borçlu, negatif = firma borçlu (emanet) */
export function Has({ value, compact = false }: { value: number; compact?: boolean }) {
  const v = Math.round(value * 1000) / 1000;
  if (v === 0) {
    return (
      <span className="has">
        <strong className="num">0</strong>
        {!compact && <small>Hesap kapalı</small>}
        {compact && <small>kapalı</small>}
      </span>
    );
  }
  const borc = v > 0;
  return (
    <span className={`has ${borc ? 'borc' : 'alacak'}`}>
      <strong className="num">{fmtGram(Math.abs(v))} gr has</strong>
      <small>{borc ? 'Müşteri borçlu' : 'Emaneti var'}</small>
    </span>
  );
}

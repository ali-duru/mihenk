'use client';
import { useState, useTransition } from 'react';
import { revealTc } from '@/app/(app)/musteriler/actions';

export function RevealTc({ id, masked }: { id: string; masked: string }) {
  const [tc, setTc] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <span className="tc">
      <span className="num">{tc ?? masked}</span>{' '}
      {tc ? (
        <button type="button" className="linkbtn" onClick={() => setTc(null)}>Gizle</button>
      ) : (
        <button
          type="button"
          className="linkbtn"
          disabled={pending}
          onClick={() => start(async () => setTc(await revealTc(id)))}
        >
          {pending ? 'Açılıyor…' : 'Göster'}
        </button>
      )}
    </span>
  );
}

'use client';
import { useState } from 'react';
import Link from 'next/link';

/** Ekran görünümü ile baskı belgesini barındırır. Yazdırırken her zaman baskı belgesi basılır. */
export function ReportFrame({ screen, doc }: { screen: React.ReactNode; doc: React.ReactNode }) {
  const [preview, setPreview] = useState(false);
  return (
    <div className={`r-frame${preview ? ' is-preview' : ''}`}>
      <div className="r-toolbar no-print">
        <Link href="/musteriler" className="back">Müşteriler</Link>
        <div className="actions">
          <button type="button" className="btn btn-ghost" aria-pressed={preview} onClick={() => setPreview((p) => !p)}>
            {preview ? 'Rapora dön' : 'Baskı önizleme'}
          </button>
          <button type="button" className="btn" onClick={() => window.print()}>
            Yazdır
          </button>
        </div>
      </div>
      <div className="screen-view">{screen}</div>
      <div className="print-view">
        <div className="paper">{doc}</div>
      </div>
    </div>
  );
}

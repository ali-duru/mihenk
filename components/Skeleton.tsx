export function SkeletonRows({ rows = 6 }: { rows?: number }) {
  return (
    <div className="sk-list" aria-busy="true" aria-label="Yükleniyor">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="sk-row">
          <span className="sk" style={{ width: `${30 + ((i * 17) % 25)}%` }} />
          <span className="sk" style={{ width: '18%' }} />
        </div>
      ))}
    </div>
  );
}

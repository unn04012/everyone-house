/**
 * 결과 목록 로딩. 스피너 대신 카드와 같은 모양으로 자리를 잡아
 * 결과가 도착할 때 레이아웃이 튀지 않게 한다.
 */
export function ResultSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="stack" aria-busy="true" aria-live="polite">
      <span className="footnote" style={{ color: 'var(--color-muted)' }}>
        공고를 확인하고 있어요…
      </span>
      {Array.from({ length: count }, (_, index) => (
        <article className="card notice skeleton-card" key={index} aria-hidden="true">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
            <div className="skeleton-line" style={{ width: 34, height: 20, borderRadius: 6 }} />
            <div className="skeleton-line" style={{ flex: 1, height: 16 }} />
          </div>
          <div className="skeleton-line" style={{ width: 128, height: 28, borderRadius: 100, marginBottom: 16 }} />
          <div className="skeleton-line" style={{ width: '100%', height: 56, borderRadius: 12 }} />
        </article>
      ))}
    </div>
  );
}

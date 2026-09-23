import type { Verdict } from '@everyone-house/domain/types';
import { VerdictCopy } from '../format/verdict-copy.js';

/** 오늘의 판정 집계. */
export function TallyCard({ tally }: { tally: { verdict: Verdict; count: number }[] }) {
  return (
    <div className="card" style={{ padding: 18 }}>
      <div className="footnote" style={{ fontWeight: 700, color: 'var(--color-muted)', marginBottom: 14 }}>
        오늘의 판정
      </div>
      <div className="tally">
        {tally.map(({ verdict, count }) => {
          const presentation = VerdictCopy.of(verdict);
          return (
            <div key={verdict} className="tally__row">
              <span>
                <span className="tally__dot" style={{ background: presentation.dotColor }} aria-hidden="true" />
                {presentation.shortLabel}
              </span>
              <b>{count}</b>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { useId, useState } from 'react';
import type { PassedCriterion } from '../api/api.types.js';

/** 통과 항목은 기본 접힘이고 개수만 노출한다 (HANDOFF §8). */
export function PassedCriteria({ items }: { items: PassedCriterion[] }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="crit">
      <button type="button" className="help__toggle passed__toggle" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((value) => !value)}>
        ✓ 통과해 보이는 기준 {items.length}개 <span style={{ color: 'var(--color-muted)', fontWeight: 600 }}>· {open ? '접기' : '펼치기'}</span>
      </button>
      <div className="passed__grid" id={panelId} hidden={!open}>
        {items.map((item) => (
          <div className="passed__item" key={item.label}>
            <span>{item.label}</span>
            <b>{item.value}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

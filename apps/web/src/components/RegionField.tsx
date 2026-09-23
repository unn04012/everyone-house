import type { LocationSchema } from '@everyone-house/domain/types';
import { RegionTable } from '../profile/region-table.js';

/** 시도 + 자치구. 자치구가 없으면 순위 판정이 1/2순위로 갈리지 않는다. */
export function RegionField({ value, onChange }: { value: LocationSchema | undefined; onChange: (next: LocationSchema) => void }) {
  const province = value?.province ?? '';
  const districts = province ? RegionTable.districtsOf(province) : [];

  return (
    <div className="field">
      <label className="field__label" htmlFor="region-province">
        시 · 도
      </label>
      <select id="region-province" className="field__select" value={province} onChange={(event) => onChange({ province: event.target.value, district: null })}>
        <option value="" disabled>
          선택해 주세요
        </option>
        {RegionTable.provinces().map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>

      {districts.length > 0 && (
        <>
          <label className="field__label" htmlFor="region-district" style={{ marginTop: 6 }}>
            시 · 군 · 구
          </label>
          <select id="region-district" className="field__select" value={value?.district ?? ''} onChange={(event) => onChange({ province, district: event.target.value || null })}>
            <option value="">아직 모르겠어요</option>
            {districts.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <span className="footnote">자치구까지 있어야 우선공급 1순위 여부를 계산할 수 있어요.</span>
        </>
      )}
    </div>
  );
}

import type { QuestionGuide } from '../profile/question-flow.js';
import { InfoIcon } from './icons.js';

/** 오입이 잦은 항목의 상시 안내. 툴팁으로 감추지 않는다 (HANDOFF §3). */
export function GuideBlock({ guide }: { guide: QuestionGuide }) {
  return (
    <div className="guide" style={{ marginBottom: 20 }}>
      <div className="guide__title">
        <InfoIcon size={14} />
        {guide.title}
      </div>
      <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {guide.items.map((item) => (
          <li key={item} className="guide__item">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

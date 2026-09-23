import { useId, useState } from 'react';
import type { QuestionHelp } from '../profile/question-flow.js';
import { InfoIcon } from './icons.js';

/**
 * 정의 도움말. 호버 툴팁이 아니라 그 자리에서 펼친다 —
 * 터치에는 호버가 없고, 중요한 안내를 감추지 않는다 (HANDOFF §3).
 */
export function DefinitionHelp({ help }: { help: QuestionHelp }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div style={{ margin: '14px 0 24px' }}>
      <button type="button" className="help__toggle" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((value) => !value)}>
        <InfoIcon />
        {help.label}
      </button>
      <div className="help__panel" id={panelId} hidden={!open}>
        {help.body}
        <div className="help__term">{help.term}</div>
      </div>
    </div>
  );
}

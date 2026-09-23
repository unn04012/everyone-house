import type { QuestionChoice } from '../profile/question-flow.js';

/** 단일 선택. 실제 button 으로 두고 aria-pressed 로 선택 상태를 알린다. */
export function ChoiceList({
  choices,
  value,
  onSelect,
  pair = false,
}: {
  choices: readonly QuestionChoice[];
  value: string | undefined;
  onSelect: (next: string) => void;
  pair?: boolean;
}) {
  return (
    <div className={pair ? 'choices choices--pair' : 'choices'}>
      {choices.map((choice) => (
        <button key={choice.value} type="button" className="choice" aria-pressed={value === choice.value} onClick={() => onSelect(choice.value)}>
          <span className="choice__label">{choice.label}</span>
          {choice.sub && <span className="choice__sub">{choice.sub}</span>}
        </button>
      ))}
    </div>
  );
}

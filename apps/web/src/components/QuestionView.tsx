import type { ApplicantCategory, LocationSchema } from '@everyone-house/domain/types';
import { useProfile } from '../app/profile-context.js';
import { ProfileCopy } from '../format/profile-copy.js';
import { QuestionKindEnum, type QuestionDefinition } from '../profile/question-flow.js';
import { AmountField } from './AmountField.js';
import { ChoiceList } from './ChoiceList.js';
import { DateField } from './DateField.js';
import { DefinitionHelp } from './DefinitionHelp.js';
import { GuideBlock } from './GuideBlock.js';
import { RegionField } from './RegionField.js';
import { Stepper } from './Stepper.js';

const YES_NO = [
  { value: 'yes', label: '예' },
  { value: 'no', label: '아니요' },
] as const;

/** 질문 하나를 그린다. 온보딩과 개별 수정 화면이 같은 컴포넌트를 쓴다. */
export function QuestionView({ question }: { question: QuestionDefinition }) {
  const { draft, setField } = useProfile();
  const value = draft.get(question.field);

  return (
    <>
      <span className="eyebrow">{question.eyebrow}</span>
      <h1 className="q-title">{question.title}</h1>
      <p className="q-sub">{question.sub}</p>

      {question.help ? <DefinitionHelp help={question.help} /> : <div style={{ height: 24 }} />}
      {question.guide && <GuideBlock guide={question.guide} />}

      {question.kind === QuestionKindEnum.AMOUNT && (
        <AmountField
          label={question.title}
          value={value as number | null | undefined}
          monthly={question.monthly}
          unknownLabel={question.unknownLabel}
          zeroLabel={question.zeroLabel}
          onChange={(next) => setField(question.field, next)}
        />
      )}

      {question.kind === QuestionKindEnum.CHOICE && question.choices && (
        <ChoiceList choices={question.choices} value={value as string | undefined} onSelect={(next) => setField('category', next as ApplicantCategory)} />
      )}

      {question.kind === QuestionKindEnum.BOOLEAN && (
        <ChoiceList
          pair
          choices={YES_NO}
          value={value === undefined ? undefined : value ? 'yes' : 'no'}
          onSelect={(next) => setField(question.field as 'isHomeless' | 'livesWithParents', next === 'yes')}
        />
      )}

      {question.kind === QuestionKindEnum.COUNT && (
        <Stepper
          label={ProfileCopy.labelOf(question.field)}
          value={value as number | undefined}
          min={question.min}
          max={question.max}
          onChange={(next) => setField('householdSize', next)}
        />
      )}

      {question.kind === QuestionKindEnum.DATE && <DateField label={question.title} value={value as string | undefined} onChange={(next) => setField('birthDate', next)} />}

      {question.kind === QuestionKindEnum.REGION && <RegionField value={value as LocationSchema | undefined} onChange={(next) => setField('residence', next)} />}
    </>
  );
}

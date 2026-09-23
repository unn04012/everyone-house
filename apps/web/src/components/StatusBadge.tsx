import { VerdictEnum, type Verdict } from '@everyone-house/domain/types';
import { VerdictCopy } from '../format/verdict-copy.js';
import { CheckIcon, MinusCircleIcon, QuestionIcon } from './icons.js';

/** 판정 뱃지. 색 단독으로 구분하지 않고 아이콘·라벨을 함께 둔다 (HANDOFF §6). */
export function StatusBadge({ verdict }: { verdict: Verdict }) {
  const presentation = VerdictCopy.of(verdict);
  return (
    <span className={`status ${presentation.className}`}>
      {verdict === VerdictEnum.LIKELY_ELIGIBLE && <CheckIcon size={15} />}
      {verdict === VerdictEnum.NEEDS_REVIEW && <QuestionIcon size={15} />}
      {verdict === VerdictEnum.NOT_ELIGIBLE && <MinusCircleIcon size={15} />}
      {presentation.label}
    </span>
  );
}

import { ScheduleStateEnum, type ScheduleStep } from '../api/api.types.js';

/** 일정. 현재 단계는 aria-current="step" 으로도 알린다. */
export function Timeline({ steps }: { steps: ScheduleStep[] }) {
  return (
    <ol className="timeline">
      {steps.map((step) => {
        const isNow = step.state === ScheduleStateEnum.NOW;
        return (
          <li key={step.name} className={isNow ? 'is-now' : undefined} aria-current={isNow ? 'step' : undefined}>
            <span className={`dot${step.state === ScheduleStateEnum.DONE ? ' dot--done' : ''}${isNow ? ' dot--now' : ''}`} aria-hidden="true" />
            <span className="t-name">{step.name}</span>
            <span className="t-date">{step.dateText}</span>
          </li>
        );
      })}
    </ol>
  );
}

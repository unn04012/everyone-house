import { useEffect, useState } from 'react';
import { KoreanMoney } from '../format/korean-money.js';

interface AmountFieldProps {
  /** undefined = 미응답, null = '잘 모르겠어요', 0 = 유효한 0원 */
  value: number | null | undefined;
  onChange: (next: number | null) => void;
  label: string;
  monthly?: boolean;
  unknownLabel?: string;
  /** 0 이 유효한 답인 경우의 문구. 모름과 나란히 놓는다 */
  zeroLabel?: string;
}

/**
 * 금액 입력 — 이 제품의 주력 컴포넌트.
 *
 * 저장은 원(정수), 표시는 한글 단위 실시간 에코. 입력 중에도 에코가 바뀌어야
 * 자릿수 오입을 잡는다 (HANDOFF §1-5).
 * `0원`(유효한 값)과 `모름(null)`은 별도 컨트롤이고 화면에서도 다르게 보인다 (§1-1).
 */
export function AmountField({ value, onChange, label, monthly = false, unknownLabel, zeroLabel }: AmountFieldProps) {
  const [text, setText] = useState<string>(() => KoreanMoney.toInputText(value));

  useEffect(() => {
    setText(KoreanMoney.toInputText(value));
  }, [value]);

  const state = value === undefined ? 'empty' : value === null ? 'unknown' : value === 0 ? 'zero' : 'value';

  const echo = (() => {
    if (state === 'unknown') {
      return '입력 안 함';
    }
    if (text === '') {
      return '';
    }
    const won = KoreanMoney.parse(text);
    if (won === null) {
      return '';
    }
    return monthly ? KoreanMoney.formatMonthly(won) : KoreanMoney.format(won);
  })();

  const handleInput = (raw: string) => {
    const won = KoreanMoney.parse(raw);
    setText(KoreanMoney.toInputText(won));
    onChange(won);
  };

  return (
    <>
      <div className="amount" data-state={state}>
        <div className="amount__row">
          <div className="amount__num">
            <input
              inputMode="numeric"
              aria-label={label}
              value={state === 'unknown' ? '' : text}
              placeholder={state === 'unknown' ? '' : '0'}
              onChange={(event) => handleInput(event.target.value)}
            />
            <span className="amount__unit">원</span>
          </div>
          <div className="amount__echo" aria-live="polite">
            {echo}
          </div>
        </div>

        {zeroLabel ? (
          <div className="amount__opts" style={{ padding: '0 18px 16px' }}>
            <button type="button" className="amount__opt" aria-pressed={state === 'zero'} onClick={() => onChange(0)}>
              {zeroLabel}
            </button>
            <button type="button" className="amount__opt" aria-pressed={state === 'unknown'} onClick={() => onChange(null)}>
              {unknownLabel ?? '잘 모르겠어요'}
            </button>
          </div>
        ) : (
          unknownLabel && (
            <button type="button" className="amount__unknown" aria-pressed={state === 'unknown'} onClick={() => onChange(null)}>
              {unknownLabel}
            </button>
          )
        )}
      </div>
      <p className="footnote" style={{ margin: '12px 2px 0', lineHeight: 1.5 }}>
        ‘{unknownLabel ?? '잘 모르겠어요'}’를 고르면 미입력으로 저장돼요. 0원과는 다르게 처리됩니다.
      </p>
    </>
  );
}

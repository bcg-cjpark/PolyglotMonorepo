import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

export interface TextareaProps {
  /** 입력값 (controlled) */
  value: string;
  /** 값 변경 콜백 (IME 조합 종료 후 확정된 값만 전달) */
  onChange: (value: string) => void;
  /** 플레이스홀더 텍스트 */
  placeholder?: string;
  /** 행 수 (기본 4) */
  rows?: number;
  /** 최대 문자 수 */
  maxLength?: number;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 에러 상태 여부 */
  error?: boolean;
  /** 에러 메시지 (error=true 일 때 하단 노출) */
  errorMessage?: string;
  /** 전체 너비 사용 여부 (Input 과 동일) */
  full?: boolean;
  /** 공백 입력 허용 여부 (기본 true). false 시 입력 단계에서 공백 제거 */
  allowSpaces?: boolean;
  /** 추가 className (컨테이너에 적용) */
  className?: string;
  /** textarea id 속성 */
  id?: string;
  /** textarea name 속성 */
  name?: string;
  /** aria-label (label 요소와 연결되지 않는 경우 사용) */
  ariaLabel?: string;
  /** 포커스 시 */
  onFocus?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  /** 블러 시 */
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
}

export interface TextareaRef {
  focus: () => void;
}

export const Textarea = memo(
  forwardRef<TextareaRef, TextareaProps>(function Textarea(
    {
      value,
      onChange,
      placeholder = '',
      rows = 4,
      maxLength,
      disabled = false,
      error = false,
      errorMessage = '',
      full = false,
      allowSpaces = true,
      className,
      id,
      name,
      ariaLabel,
      onFocus,
      onBlur,
    },
    ref
  ) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [internalValue, setInternalValue] = useState(value);
    const isComposingRef = useRef(false);

    useEffect(() => {
      setInternalValue(value);
    }, [value]);

    useImperativeHandle(ref, () => ({
      focus: () => textareaRef.current?.focus(),
    }));

    const processValue = useCallback(
      (raw: string): string => {
        let v = raw;
        // allowSpaces=false 시 전체 공백/개행 제거 (Input 과 동일 정책)
        if (!allowSpaces) v = v.replace(/\s/g, '');
        if (maxLength && v.length > maxLength) v = v.slice(0, maxLength);
        return v;
      },
      [allowSpaces, maxLength]
    );

    const handleInput = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const raw = e.target.value;
        if (isComposingRef.current) {
          // IME 조합 중엔 controlled textarea 가 DOM 과 싱크 유지되도록 raw 를
          // internal state 에만 반영. 필터/부모 onChange 는 compositionend 에서
          // 최종 확정. 여기서 early return 하면 DOM value ≠ React state 가 되어
          // 이후 입력이 막힘 (Input.tsx 와 동일 패턴).
          setInternalValue(raw);
          return;
        }
        const processed = processValue(raw);
        setInternalValue(processed);
        onChange(processed);
      },
      [processValue, onChange]
    );

    const handleCompositionStart = useCallback(() => {
      isComposingRef.current = true;
    }, []);

    const handleCompositionEnd = useCallback(
      (e: React.CompositionEvent<HTMLTextAreaElement>) => {
        isComposingRef.current = false;
        const raw = (e.target as HTMLTextAreaElement).value;
        const processed = processValue(raw);
        setInternalValue(processed);
        onChange(processed);
      },
      [processValue, onChange]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // allowSpaces=false: 스페이스 키 자체를 차단 (IME 조합 외 입력 경로)
        if (!allowSpaces && e.key === ' ') {
          e.preventDefault();
        }
      },
      [allowSpaces]
    );

    const containerClasses = useMemo(() => {
      const widthClass = full ? 'w-full' : '';
      const base = `relative ${widthClass} rounded-md transition-all duration-150 flex bg-[var(--input-color-surface)] border border-solid`;

      if (disabled) {
        return `${base} bg-input-bg-disabled border-input-border-disabled text-input-text-disable cursor-not-allowed`;
      }
      if (error) {
        return `${base} border-input-border-error focus-within:border-input-border-error focus-within:shadow-[0_0_0_1px_var(--input-color-border-error)]`;
      }
      return `${base} border-input-border-static focus-within:border-input-border-focus focus-within:shadow-[0_0_0_1px_var(--input-color-border-focus)] hover:border-input-border-focus`;
    }, [full, disabled, error]);

    const textareaClasses = useMemo(() => {
      const base =
        'textarea-root box-border w-full min-w-0 bg-transparent border-0 outline-none tracking-[-0.35px] px-[15px] py-[13px] text-[16px] leading-[20px]';
      const textStyles = disabled
        ? 'text-input-text-disable cursor-not-allowed placeholder:text-input-text-disable'
        : 'text-input-text-static placeholder:text-input-text-placeholder placeholder:font-normal placeholder:tracking-[-0.35px]';
      return `${base} ${textStyles}`;
    }, [disabled]);

    const wrapperClasses = [
      full ? 'flex w-full flex-col' : 'flex flex-col',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={wrapperClasses}>
        <div className={containerClasses}>
          <textarea
            ref={textareaRef}
            id={id}
            name={name}
            value={internalValue}
            placeholder={placeholder}
            rows={rows}
            maxLength={maxLength}
            disabled={disabled}
            aria-label={ariaLabel}
            aria-invalid={error || undefined}
            className={textareaClasses}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            onFocus={onFocus}
            onBlur={onBlur}
          />
        </div>

        {error && errorMessage && (
          <div className="text-input-text-error mt-1 text-[12px] font-medium">
            {errorMessage}
          </div>
        )}
      </div>
    );
  })
);

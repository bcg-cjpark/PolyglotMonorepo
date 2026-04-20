import { Icon } from '#/components/Icon';
import { ProgressBar } from '#/components/ProgressBar';
import {
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  useEffect,
} from 'react';

export interface InputProps {
  /** 입력값 */
  value?: string;
  /** 플레이스홀더 텍스트 */
  placeholder?: string;
  /** 크기 */
  size?: 'sm' | 'md';
  /** 입력 타입 변형 */
  variant?: 'default' | 'search' | 'password' | 'password-strength' | 'tel' | 'number';
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 에러 상태 여부 */
  error?: boolean;
  /** 에러 메시지 */
  errorMessage?: string;
  /** 에러 메시지 오버플로우 허용 여부 */
  errorMessageOverflow?: boolean;
  /** 읽기 전용 여부 */
  readOnly?: boolean;
  /** 최대 문자 수 */
  maxLength?: number;
  /** autocomplete 속성 */
  autoComplete?: string;
  /** 전체 너비 사용 여부 */
  full?: boolean;
  /** input name 속성 */
  name?: string;
  /** 입력값 포맷팅 함수 */
  formatter?: (value: string) => string;
  /** 띄어쓰기 허용 여부 */
  allowSpaces?: boolean;
  /** 영문/숫자 필터링 */
  filter?: 'english' | 'numeric';
  /** 텍스트 정렬 */
  textAlign?: 'left' | 'right' | 'center';
  /** 비밀번호 강도 분석 시 사용자 입력 데이터 */
  userInputs?: string[];
  /** 값 변경 시 */
  onChange?: (value: string) => void;
  /** 포커스 시 */
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  /** 블러 시 */
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  /** 검색 시 (variant="search") */
  onSearch?: () => void;
  /** 외부 좌측 컨텐츠 */
  prepend?: React.ReactNode;
  /** 내부 좌측 컨텐츠 */
  prependInner?: React.ReactNode;
  /** 내부 우측 컨텐츠 */
  appendInner?: React.ReactNode;
  /** 외부 우측 컨텐츠 */
  append?: React.ReactNode;
}

export interface InputRef {
  focus: () => void;
}

export const Input = memo(
  forwardRef<InputRef, InputProps>(function Input(
    {
      value = '',
      placeholder = '',
      size = 'md',
      variant = 'default',
      disabled = false,
      error = false,
      errorMessage = '',
      errorMessageOverflow = false,
      readOnly = false,
      maxLength,
      autoComplete,
      full = false,
      name,
      formatter,
      allowSpaces = false,
      filter,
      textAlign = 'left',
      userInputs = [],
      onChange,
      onFocus,
      onBlur,
      onSearch,
      prepend,
      prependInner,
      appendInner,
      append,
    },
    ref
  ) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [internalValue, setInternalValue] = useState(value);
    const [passwordStrength, setPasswordStrength] = useState<0 | 1 | 2 | 3 | 4>(0);
    const isComposingRef = useRef(false);
    const pendingSearchRef = useRef(false);

    useEffect(() => {
      setInternalValue(value);
    }, [value]);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
    }));

    const showVariantIcon =
      variant === 'search' || variant === 'password' || variant === 'password-strength';

    const inputType = useMemo(() => {
      if ((variant === 'password' || variant === 'password-strength') && !isPasswordVisible)
        return 'password';
      if (variant === 'tel') return 'tel';
      if (variant === 'number') return 'number';
      return 'text';
    }, [variant, isPasswordVisible]);

    const autocompleteValue = useMemo(() => {
      if (autoComplete !== undefined) return autoComplete;
      if (variant === 'password' || variant === 'password-strength') return 'new-password';
      if (variant === 'search') return 'off';
      return undefined;
    }, [autoComplete, variant]);

    const iconClasses =
      'text-input-text-static hover:text-input-text-hover cursor-pointer select-none rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1';

    const sizeClasses =
      size === 'sm'
        ? 'px-[15px] py-[13px] text-[13px] leading-[16px]'
        : 'px-[15px] py-[13px] text-[16px] leading-[20px]';

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

    const inputMinHeightClass = size === 'sm' ? 'min-h-[42px]' : 'min-h-[46px]';

    const inputClasses = useMemo(() => {
      const base = `box-border w-full min-w-0 bg-transparent border-0 outline-none tracking-[-0.35px] ${inputMinHeightClass} ${sizeClasses}`;
      const padding = showVariantIcon ? 'pr-[45px]' : '';
      const textStyles = disabled
        ? 'text-input-text-disable cursor-not-allowed placeholder:text-input-text-disable'
        : 'text-input-text-static placeholder:text-input-text-placeholder placeholder:font-normal placeholder:tracking-[-0.35px]';
      const alignmentClass =
        textAlign === 'right'
          ? 'text-right pr-[24px] text-[20px] font-semibold py-[24px]'
          : textAlign === 'center'
            ? 'text-center'
            : 'text-left';
      const imeClass =
        variant === 'password' || variant === 'password-strength' ? 'ime-disabled' : '';

      return `${base} ${padding} ${textStyles} ${alignmentClass} ${imeClass}`;
    }, [inputMinHeightClass, sizeClasses, showVariantIcon, disabled, textAlign, variant]);

    const prependInnerClasses =
      size === 'sm'
        ? 'flex items-center pl-[24px] text-input-text-static font-normal tracking-[-0.35px] text-[13px] leading-[16px]'
        : 'flex items-center pl-[24px] text-input-text-static font-normal tracking-[-0.35px] text-[16px] leading-[20px]';

    const appendInnerClasses =
      'absolute right-0 top-0 z-10 flex h-full shrink-0 items-center pr-[15px] gap-1';

    const processValue = useCallback(
      (raw: string): string => {
        let v = raw;
        if (!allowSpaces) v = v.replace(/\s/g, '');
        if (variant === 'tel') v = v.replace(/[^0-9]/g, '');
        if (maxLength && v.length > maxLength) v = v.slice(0, maxLength);
        if (filter === 'english') v = v.replace(/[^a-zA-Z]/g, '');
        if (filter === 'numeric') v = v.replace(/[^0-9.,]/g, '');
        if (formatter) v = formatter(v);
        return v;
      },
      [allowSpaces, variant, maxLength, filter, formatter]
    );

    const handleInput = useCallback(
      (e: React.FormEvent<HTMLInputElement>) => {
        if (isComposingRef.current) return;
        const raw = (e.target as HTMLInputElement).value;
        const processed = processValue(raw);
        setInternalValue(processed);
        onChange?.(processed);

        // password-strength: 간단한 점수 계산 (zxcvbn 없이)
        if (variant === 'password-strength') {
          if (!processed) {
            setPasswordStrength(0);
          } else {
            const len = processed.length;
            const hasUpper = /[A-Z]/.test(processed);
            const hasLower = /[a-z]/.test(processed);
            const hasNum = /[0-9]/.test(processed);
            const hasSpecial = /[^a-zA-Z0-9]/.test(processed);
            const types = [hasUpper, hasLower, hasNum, hasSpecial].filter(Boolean).length;
            let score = 0;
            if (len >= 4) score = 1;
            if (len >= 8 && types >= 2) score = 2;
            if (len >= 10 && types >= 3) score = 3;
            if (len >= 12 && types >= 4) score = 4;
            setPasswordStrength(score as 0 | 1 | 2 | 3 | 4);
          }
        }
      },
      [processValue, onChange, variant]
    );

    const handleCompositionStart = useCallback(() => {
      isComposingRef.current = true;
    }, []);

    const handleCompositionEnd = useCallback(
      (e: React.CompositionEvent<HTMLInputElement>) => {
        isComposingRef.current = false;
        const raw = (e.target as HTMLInputElement).value;
        const processed = processValue(raw);
        setInternalValue(processed);
        onChange?.(processed);

        if (pendingSearchRef.current) {
          pendingSearchRef.current = false;
          setTimeout(() => onSearch?.(), 0);
        }
      },
      [processValue, onChange, onSearch]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === ' ' && !allowSpaces) {
          e.preventDefault();
        }

        if (variant === 'search' && (e.key === 'Enter' || e.key === ' ')) {
          if (isComposingRef.current) {
            pendingSearchRef.current = true;
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          onSearch?.();
        }
      },
      [allowSpaces, variant, onSearch]
    );

    const handlePasswordKeyDown = useCallback((e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        setIsPasswordVisible((prev) => !prev);
      }
    }, []);

    return (
      <div className={full ? 'flex w-full flex-col' : 'flex flex-col'}>
        <div className={full ? 'flex w-full items-center gap-2' : 'flex items-center gap-2'}>
          {/* 외부 좌측 prepend */}
          {prepend && <div className="flex-shrink-0">{prepend}</div>}

          {/* 입력 컨테이너 */}
          <div className={`${containerClasses}${full ? 'flex-1' : ''}`}>
            {/* 내부 좌측 prepend-inner */}
            {prependInner && <div className={prependInnerClasses}>{prependInner}</div>}

            {/* 입력 필드 */}
            <div className="relative min-w-0 flex-1">
              <input
                ref={inputRef}
                value={internalValue}
                type={inputType}
                name={name}
                placeholder={placeholder}
                disabled={disabled}
                readOnly={readOnly}
                maxLength={maxLength}
                autoComplete={autocompleteValue}
                inputMode={
                  variant === 'password' || variant === 'password-strength' ? 'text' : undefined
                }
                lang={variant === 'password' || variant === 'password-strength' ? 'en' : undefined}
                className={inputClasses}
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                onFocus={onFocus}
                onBlur={onBlur}
              />

              {/* Variant 아이콘 */}
              {showVariantIcon && (
                <div className={appendInnerClasses}>
                  {variant === 'search' && (
                    <Icon
                      name="search"
                      size={size === 'sm' ? 'sm' : 'md'}
                      className={iconClasses}
                    />
                  )}
                  {(variant === 'password' || variant === 'password-strength') && (
                    <span
                      role="button"
                      tabIndex={0}
                      className="inline-flex shrink-0"
                      aria-label={isPasswordVisible ? '비밀번호 숨기기' : '비밀번호 표시'}
                      onClick={() => setIsPasswordVisible((prev) => !prev)}
                      onKeyDown={handlePasswordKeyDown}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <Icon
                        name={isPasswordVisible ? 'eye' : 'eye-close'}
                        size={size === 'sm' ? 'sm' : 'md'}
                        className={iconClasses}
                      />
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* 내부 우측 append-inner */}
            {appendInner && (
              <div className={`${appendInnerClasses.replace('gap-1', 'z-10 gap-1')}`}>
                {appendInner}
              </div>
            )}
          </div>

          {/* 외부 우측 append */}
          {append && <div className="flex-shrink-0">{append}</div>}
        </div>

        {/* 에러 메시지 */}
        {error && errorMessage && (
          <div
            className={`text-input-border-error mt-1 text-[12px] font-medium ${errorMessageOverflow ? 'whitespace-nowrap' : ''}`}
          >
            {errorMessage}
          </div>
        )}

        {/* 비밀번호 강도 진행바 */}
        {variant === 'password-strength' && internalValue.length > 0 && (
          <div className="mt-1">
            <ProgressBar
              strengthScore={passwordStrength}
              variant="password-strength"
              showLabel
            />
          </div>
        )}
      </div>
    );
  })
);

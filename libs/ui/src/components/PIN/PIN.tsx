import { Icon } from '#/components/Icon';
import { memo, useCallback, useMemo, useState, useEffect } from 'react';

const KEYPAD_SPECIAL_KEYS = {
  BACKSPACE: 'BACKSPACE',
  EMPTY: 'EMPTY',
} as const;

export interface PINProps {
  /** 현재 입력된 PIN 배열 */
  pin: string[];
  /** PIN 길이 */
  pinLength?: number;
  /** 컨텐츠 슬롯 (PIN 인디케이터와 키패드 사이) */
  renderContent?: React.ReactNode;
  /** 키 입력 시 */
  onKeyPress?: (key: string) => void;
}

function createKeypadLayout(): string[][] {
  const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const shuffled = [...numbers].sort(() => Math.random() - 0.5);

  const BACKSPACE_POSITION = 11; // 2행 3열
  const availablePositions = Array.from({ length: 12 }, (_, i) => i).filter(
    (pos) => pos !== BACKSPACE_POSITION
  );
  const emptyPosition = availablePositions[Math.floor(Math.random() * availablePositions.length)];

  const layout: string[][] = [];
  let numberIndex = 0;

  for (let row = 0; row < 3; row++) {
    const rowItems: string[] = [];
    for (let col = 0; col < 4; col++) {
      const position = row * 4 + col;
      if (position === BACKSPACE_POSITION) {
        rowItems.push(KEYPAD_SPECIAL_KEYS.BACKSPACE);
      } else if (position === emptyPosition) {
        rowItems.push(KEYPAD_SPECIAL_KEYS.EMPTY);
      } else {
        rowItems.push(shuffled[numberIndex++]);
      }
    }
    layout.push(rowItems);
  }

  return layout;
}

export const PIN = memo(function PIN({
  pin,
  pinLength = 6,
  renderContent,
  onKeyPress,
}: PINProps) {
  const [keypadLayout, setKeypadLayout] = useState<string[][]>([]);

  useEffect(() => {
    setKeypadLayout(createKeypadLayout());
  }, []);

  const handleKeyPress = useCallback(
    (key: string) => {
      if (key === KEYPAD_SPECIAL_KEYS.EMPTY) return;
      if (key === KEYPAD_SPECIAL_KEYS.BACKSPACE) {
        onKeyPress?.(key);
        return;
      }
      if (pin.length >= pinLength) return;
      onKeyPress?.(key);
    },
    [pin.length, pinLength, onKeyPress]
  );

  const indicators = useMemo(() => Array.from({ length: pinLength }, (_, i) => i), [pinLength]);

  return (
    <div className="flex w-full flex-col items-center gap-[var(--base-size-size-8)] bg-[var(--background-bg-default)]">
      {/* PIN 인디케이터 */}
      <div className="flex flex-row items-center justify-center gap-[var(--base-size-size-8)] py-[var(--base-size-size-16)]">
        {indicators.map((index) => (
          <div
            key={index}
            className={`h-[var(--base-size-size-16)] w-[var(--base-size-size-16)] rounded-[var(--radius-pill)] border border-[var(--background-bg-outline)] ${
              pin.length > index
                ? 'bg-[var(--background-primary)]'
                : 'bg-[var(--background-bg-default)]'
            }`}
          />
        ))}
      </div>

      {/* 컨텐츠 슬롯 */}
      {renderContent}

      {/* 키패드 */}
      <div className="flex w-full flex-col gap-[var(--base-size-size-4)] rounded-[6px] bg-[var(--background-bg-innerframe)] p-[var(--base-size-size-8)]">
        {keypadLayout.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-4 gap-[var(--base-size-size-4)]">
            {row.map((key, colIndex) => {
              if (key === KEYPAD_SPECIAL_KEYS.EMPTY) {
                return <div key={`${rowIndex}-${colIndex}`} className="h-10 w-full" />;
              }

              if (key === KEYPAD_SPECIAL_KEYS.BACKSPACE) {
                return (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    type="button"
                    className="flex h-10 w-full items-center justify-center rounded-[4px] bg-[var(--background-bg-surface)]"
                    onClick={() => handleKeyPress(key)}
                  >
                    <Icon name="delete" size="md" color="var(--font-color-default)" />
                  </button>
                );
              }

              return (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  type="button"
                  className="flex h-10 w-full items-center justify-center rounded-[4px] border border-[var(--background-bg-outline)] bg-[var(--background-bg-default)] text-[var(--font-color-default)] [font-size:var(--font-size-font-18)]"
                  onClick={() => handleKeyPress(key)}
                >
                  {key}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
});

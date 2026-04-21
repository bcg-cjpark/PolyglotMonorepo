import { Icon } from '#/components/Icon';
import {
  Disclosure as HUIDisclosure,
  DisclosureButton as HUIDisclosureButton,
  DisclosurePanel as HUIDisclosurePanel,
} from '@headlessui/react';
import { memo, useMemo } from 'react';

export interface DisclosureProps {
  /** 기본적으로 열려있는지 여부 */
  defaultOpen?: boolean;
  /** 버튼에 표시될 텍스트 (기본 모드) */
  buttonText?: string;
  /** 패널에 표시될 내용 (기본 모드) */
  panelContent?: string;
  /** 커스텀 스타일 사용 여부 */
  custom?: boolean;
  /** 버튼 색상 테마 (디자인 토큰 팔레트 기반) */
  color?: 'red' | 'blue' | 'neutral' | 'purple' | 'primary';
  /** 커스텀 모드에서 화살표 표시 여부 */
  showArrow?: boolean;
  /** 커스텀 모드에서 화살표 오른쪽 위치 (px) */
  arrowPosition?: number;
  /** 커스텀 버튼 렌더 */
  renderButton?: React.ReactNode;
  /** 커스텀 패널 렌더 */
  renderPanel?: React.ReactNode;
}

// 디자인 토큰 브릿지(tailwind-bridge.css)의 `--color-<scale>-<scale><shade>` 규칙에
// 맞춘 유틸리티 사용. data-theme 전환 시 토큰 값이 자동으로 바뀌므로
// light/dark 양쪽에서 올바른 색이 잡힌다.
const COLOR_CLASSES = {
  red: {
    button:
      'bg-red-red100 text-red-red900 hover:bg-red-red200 focus-visible:ring-red-red500',
    icon: 'text-red-red500',
  },
  blue: {
    button:
      'bg-blue-blue100 text-blue-blue800 hover:bg-blue-blue200 focus-visible:ring-blue-blue500',
    icon: 'text-blue-blue500',
  },
  neutral: {
    button:
      'bg-neutral-neutral100 text-neutral-neutral700 hover:bg-neutral-neutral200 focus-visible:ring-neutral-neutral500',
    icon: 'text-neutral-neutral500',
  },
  purple: {
    button:
      'bg-purple-purple100 text-purple-purple800 hover:bg-purple-purple200 focus-visible:ring-purple-purple500',
    icon: 'text-purple-purple500',
  },
  primary: {
    button:
      'bg-primary-primary100 text-primary-primary-deep hover:bg-primary-primary200 focus-visible:ring-primary-primary500',
    icon: 'text-primary-primary500',
  },
};

export const Disclosure = memo(function Disclosure({
  defaultOpen = false,
  buttonText = '',
  panelContent = '',
  custom = false,
  color = 'neutral',
  showArrow = true,
  arrowPosition = 16,
  renderButton,
  renderPanel,
}: DisclosureProps) {
  const defaultButtonClasses = useMemo(() => {
    const base =
      'flex items-center w-full justify-between rounded-md px-4 py-2 text-left text-sm font-medium focus:outline-none focus-visible:ring focus-visible:ring-opacity-75';
    return `${base} ${COLOR_CLASSES[color].button}`;
  }, [color]);

  return (
    <HUIDisclosure defaultOpen={defaultOpen} as="div" className="block w-full min-w-0">
      {({ open }) => (
        <>
          {custom ? (
            <>
              <HUIDisclosureButton as="div" className="relative block w-full min-w-0">
                {renderButton}
                {showArrow && (
                  <div
                    className="absolute top-1/2 flex-shrink-0 -translate-y-1/2 transform"
                    style={{ right: `${arrowPosition}px` }}
                  >
                    <Icon
                      name="arrow-down"
                      className={`h-5 w-5 ${open ? 'hidden' : 'block'}`}
                    />
                    <Icon name="arrow-up" className={`h-5 w-5 ${!open ? 'hidden' : 'block'}`} />
                  </div>
                )}
              </HUIDisclosureButton>

              <HUIDisclosurePanel as="div" className="block w-full min-w-0">
                {renderPanel}
              </HUIDisclosurePanel>
            </>
          ) : (
            <>
              <HUIDisclosureButton as="div" className={defaultButtonClasses}>
                <span className="min-w-0 flex-1">{buttonText}</span>
                <Icon name="arrow-down" className={`h-5 w-5 ${open ? 'hidden' : 'block'}`} />
                <Icon name="arrow-up" className={`h-5 w-5 ${!open ? 'hidden' : 'block'}`} />
              </HUIDisclosureButton>

              <HUIDisclosurePanel as="div" className="w-full px-4 pb-2 pt-4 text-sm text-default-muted">
                {panelContent}
              </HUIDisclosurePanel>
            </>
          )}
        </>
      )}
    </HUIDisclosure>
  );
});

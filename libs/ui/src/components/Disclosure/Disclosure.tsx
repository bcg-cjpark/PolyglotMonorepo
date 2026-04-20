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
  /** 버튼 색상 테마 */
  color?: 'red' | 'blue' | 'gray' | 'purple';
  /** 커스텀 모드에서 화살표 표시 여부 */
  showArrow?: boolean;
  /** 커스텀 모드에서 화살표 오른쪽 위치 (px) */
  arrowPosition?: number;
  /** 커스텀 버튼 렌더 */
  renderButton?: React.ReactNode;
  /** 커스텀 패널 렌더 */
  renderPanel?: React.ReactNode;
}

const COLOR_CLASSES = {
  red: {
    button: 'bg-red-100 text-red-900 hover:bg-red-200 focus-visible:ring-red-500',
    icon: 'text-red-500',
  },
  blue: {
    button: 'bg-blue-100 text-blue-900 hover:bg-blue-200 focus-visible:ring-blue-500',
    icon: 'text-blue-500',
  },
  gray: {
    button: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500',
    icon: 'text-gray-500',
  },
  purple: {
    button: 'bg-purple-100 text-purple-900 hover:bg-purple-200 focus-visible:ring-purple-500',
    icon: 'text-purple-500',
  },
};

export const Disclosure = memo(function Disclosure({
  defaultOpen = false,
  buttonText = '',
  panelContent = '',
  custom = false,
  color = 'gray',
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

              <HUIDisclosurePanel as="div" className="w-full px-4 pb-2 pt-4 text-sm text-gray-500">
                {panelContent}
              </HUIDisclosurePanel>
            </>
          )}
        </>
      )}
    </HUIDisclosure>
  );
});

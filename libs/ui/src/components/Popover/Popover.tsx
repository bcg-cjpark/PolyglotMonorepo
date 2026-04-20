import {
  Popover as HUIPopover,
  PopoverButton as HUIPopoverButton,
  PopoverPanel as HUIPopoverPanel,
  Transition,
} from '@headlessui/react';
import { memo, Fragment } from 'react';

export type PopoverPosition =
  | 'top'
  | 'top-left'
  | 'top-right'
  | 'bottom'
  | 'bottom-left'
  | 'bottom-right'
  | 'left'
  | 'right';

export interface PopoverProps {
  /** PopoverPanel에 적용할 클래스 */
  panelClass?: string;
  /** 패널 위치 */
  position?: PopoverPosition;
  /** 트리거 요소 (open 상태를 받는 render function 또는 ReactNode) */
  renderTrigger?: (props: { open: boolean }) => React.ReactNode;
  /** 팝오버 컨텐츠 (close 함수를 받는 render function 또는 ReactNode) */
  renderContent?: (props: { open: boolean; close: () => void }) => React.ReactNode;
  /** 트리거 (간단한 경우) */
  children?: React.ReactNode;
}

const POSITION_CLASSES: Record<PopoverPosition, string> = {
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  'bottom-left': 'top-full left-0 mt-2',
  'bottom-right': 'top-full right-0 mt-2',
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  'top-left': 'bottom-full left-0 mb-2',
  'top-right': 'bottom-full right-0 mb-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

export const Popover = memo(function Popover({
  panelClass = '',
  position = 'bottom',
  renderTrigger,
  renderContent,
  children,
}: PopoverProps) {
  return (
    <HUIPopover className="base-popover relative">
      {({ open, close }) => (
        <>
          <HUIPopoverButton as={Fragment}>
            {renderTrigger ? renderTrigger({ open }) : children}
          </HUIPopoverButton>

          <Transition
            as={Fragment}
            enter="transition duration-200 ease-out"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="transition duration-150 ease-in"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <HUIPopoverPanel
              className={[
                'base-popover__panel absolute z-50',
                POSITION_CLASSES[position],
                panelClass,
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {renderContent?.({ open, close })}
            </HUIPopoverPanel>
          </Transition>
        </>
      )}
    </HUIPopover>
  );
});

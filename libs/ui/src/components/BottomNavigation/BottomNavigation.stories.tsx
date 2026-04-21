import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { BottomNavigation } from './BottomNavigation';
import type { BottomNavigationItem } from './BottomNavigation';

const THREE_ITEMS: BottomNavigationItem[] = [
  { value: 'home', label: '홈', icon: 'home' },
  { value: 'list', label: '리스트', icon: 'list' },
  { value: 'my', label: '마이', icon: 'person' },
];

const FOUR_ITEMS: BottomNavigationItem[] = [
  { value: 'home', label: '홈', icon: 'home' },
  { value: 'search', label: '검색', icon: 'search' },
  { value: 'noti', label: '알림', icon: 'notification' },
  { value: 'my', label: '마이', icon: 'person' },
];

const FIVE_ITEMS: BottomNavigationItem[] = [
  { value: 'home', label: '홈', icon: 'home' },
  { value: 'search', label: '검색', icon: 'search' },
  { value: 'favorite', label: '즐겨찾기', icon: 'favorite' },
  { value: 'noti', label: '알림', icon: 'notification' },
  { value: 'my', label: '마이', icon: 'person' },
];

const WITH_DISABLED: BottomNavigationItem[] = [
  { value: 'home', label: '홈', icon: 'home' },
  { value: 'list', label: '리스트', icon: 'list' },
  { value: 'locked', label: '잠김', icon: 'settings', disabled: true },
  { value: 'my', label: '마이', icon: 'person' },
];

const meta: Meta<typeof BottomNavigation> = {
  title: 'Components/BottomNavigation',
  component: BottomNavigation,
  tags: ['autodocs'],
  argTypes: {
    showLabels: { control: 'boolean' },
    items: { control: false },
    value: { control: false },
    onChange: { action: 'changed' },
  },
  args: {
    items: THREE_ITEMS,
  },
  decorators: [
    (Story, ctx) => {
      const [value, setValue] = useState<string | number>(ctx.args.value ?? 'home');
      return (
        <div
          style={{
            width: 360,
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <Story
            args={{
              ...ctx.args,
              value,
              onChange: (next, item) => {
                setValue(next);
                ctx.args.onChange?.(next, item);
              },
            }}
          />
        </div>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof BottomNavigation>;

export const Default: Story = {};

export const ThreeItems: Story = {
  args: { items: THREE_ITEMS },
};

export const FourItems: Story = {
  args: { items: FOUR_ITEMS },
};

export const FiveItems: Story = {
  args: { items: FIVE_ITEMS },
};

export const IconsOnly: Story = {
  args: { items: FOUR_ITEMS, showLabels: false },
};

export const WithDisabledItem: Story = {
  args: { items: WITH_DISABLED },
};

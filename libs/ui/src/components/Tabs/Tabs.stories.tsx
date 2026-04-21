import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Tabs } from './Tabs';
import type { TabItem } from './Tabs';

const BASE_TABS: TabItem[] = [
  { key: 'overview', label: '개요', panel: <div>개요 탭 컨텐츠입니다.</div> },
  { key: 'detail', label: '상세', panel: <div>상세 탭 컨텐츠입니다.</div> },
  { key: 'review', label: '리뷰', panel: <div>리뷰 탭 컨텐츠입니다.</div> },
];

const ICON_TABS: TabItem[] = [
  { key: 'home', label: '홈', icon: 'home', panel: <div>홈 화면</div> },
  { key: 'list', label: '리스트', icon: 'list', panel: <div>리스트 화면</div> },
  { key: 'my', label: '마이', icon: 'person', panel: <div>마이 화면</div> },
];

const PARTIAL_DISABLED: TabItem[] = [
  { key: 'a', label: '사용 가능', panel: <div>A</div> },
  { key: 'b', label: '잠김', disabled: true, panel: <div>B</div> },
  { key: 'c', label: '사용 가능', panel: <div>C</div> },
];

const meta: Meta<typeof Tabs> = {
  title: 'Components/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['underline', 'inner', 'button'],
    },
    size: {
      control: 'select',
      options: ['lg', 'md'],
    },
    underline: { control: 'boolean' },
    hasBackground: { control: 'boolean' },
    fullwidth: { control: 'boolean' },
    ariaLabel: { control: 'text' },
    tabs: { control: false },
    value: { control: false },
    onChange: { action: 'changed' },
  },
  args: {
    variant: 'underline',
    size: 'lg',
    fullwidth: false,
    tabs: BASE_TABS,
  },
  decorators: [
    (Story, ctx) => {
      const firstKey = (ctx.args.tabs as TabItem[] | undefined)?.[0]?.key ?? '';
      const [value, setValue] = useState<string>(
        typeof ctx.args.value === 'string' ? ctx.args.value : firstKey
      );
      return (
        <div style={{ width: 520 }}>
          <Story
            args={{
              ...ctx.args,
              value,
              onChange: (next: string) => {
                setValue(next);
                ctx.args.onChange?.(next);
              },
            }}
          />
        </div>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {};

export const UnderlineMd: Story = {
  args: { variant: 'underline', size: 'md' },
};

export const UnderlineFullWidth: Story = {
  args: { variant: 'underline', fullwidth: true },
};

export const UnderlineWithLine: Story = {
  args: { variant: 'underline', underline: true, hasBackground: true },
};

export const Inner: Story = {
  args: { variant: 'inner' },
};

export const ButtonVariant: Story = {
  args: { variant: 'button' },
};

export const WithIcons: Story = {
  args: { tabs: ICON_TABS },
};

export const PartiallyDisabled: Story = {
  args: { tabs: PARTIAL_DISABLED },
};

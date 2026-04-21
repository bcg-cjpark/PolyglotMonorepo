import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { RadioGroup } from './RadioGroup';
import type { RadioOption } from './RadioGroup';

const BASE_OPTIONS: RadioOption[] = [
  { value: 'all', label: '전체' },
  { value: 'active', label: '활성' },
  { value: 'paused', label: '일시정지' },
  { value: 'archived', label: '보관됨' },
];

const ICON_OPTIONS: RadioOption[] = [
  { value: 'home', label: '홈', icon: 'home' },
  { value: 'list', label: '리스트', icon: 'list' },
  { value: 'noti', label: '알림', icon: 'notification' },
];

const CHIP_OPTIONS: RadioOption[] = [
  { value: 'new', label: '신규', chipLabel: '3', chipVariant: 'blue' },
  { value: 'open', label: '진행중', chipLabel: '12', chipVariant: 'green' },
  { value: 'done', label: '완료', chipLabel: '48', chipVariant: 'grey' },
];

const meta: Meta<typeof RadioGroup> = {
  title: 'Components/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'underline'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md'],
    },
    disabled: { control: 'boolean' },
    fullwidth: { control: 'boolean' },
    noUnderline: { control: 'boolean' },
    scrollable: { control: 'boolean' },
    label: { control: 'text' },
    name: { control: 'text' },
    options: { control: false },
    value: { control: false },
    allowedList: { control: false },
    onChange: { action: 'changed' },
  },
  args: {
    variant: 'default',
    size: 'md',
    disabled: false,
    fullwidth: false,
    noUnderline: false,
    scrollable: false,
    options: BASE_OPTIONS,
  },
  decorators: [
    (Story, ctx) => {
      const [value, setValue] = useState<unknown>(ctx.args.value ?? 'all');
      return (
        <div style={{ width: 480 }}>
          <Story
            args={{
              ...ctx.args,
              value,
              onChange: (next: unknown) => {
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
type Story = StoryObj<typeof RadioGroup>;

export const Default: Story = {};

export const Small: Story = {
  args: { size: 'sm' },
};

export const Underline: Story = {
  args: { variant: 'underline', fullwidth: true },
};

export const UnderlineSmall: Story = {
  args: { variant: 'underline', size: 'sm' },
};

export const WithLabel: Story = {
  args: { label: '상태 필터' },
};

export const WithIcons: Story = {
  args: { options: ICON_OPTIONS, value: 'grid' },
};

export const WithChips: Story = {
  args: { options: CHIP_OPTIONS, value: 'open' },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const PartiallyDisabled: Story = {
  args: {
    options: [
      { value: 'a', label: '옵션 A' },
      { value: 'b', label: '옵션 B', disabled: true },
      { value: 'c', label: '옵션 C' },
    ],
    value: 'a',
  },
};

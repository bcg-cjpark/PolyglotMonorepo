import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { PIN } from './PIN';

const meta: Meta<typeof PIN> = {
  title: 'Components/PIN',
  component: PIN,
  tags: ['autodocs'],
  argTypes: {
    pinLength: { control: { type: 'number', min: 4, max: 8, step: 1 } },
    pin: { control: false },
    renderContent: { control: false },
    onKeyPress: { action: 'keyPress' },
  },
  args: {
    pinLength: 6,
    pin: [],
  },
  decorators: [
    (Story, ctx) => {
      const [pin, setPin] = useState<string[]>(ctx.args.pin ?? []);
      const pinLength = ctx.args.pinLength ?? 6;
      const handleKeyPress = (key: string) => {
        if (key === 'BACKSPACE') {
          setPin((prev) => prev.slice(0, -1));
        } else if (pin.length < pinLength) {
          setPin((prev) => [...prev, key]);
        }
        ctx.args.onKeyPress?.(key);
      };
      return (
        <div style={{ width: 360 }}>
          <Story args={{ ...ctx.args, pin, onKeyPress: handleKeyPress }} />
        </div>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof PIN>;

export const Default: Story = {};

export const FourDigits: Story = {
  args: { pinLength: 4 },
};

export const EightDigits: Story = {
  args: { pinLength: 8 },
};

export const WithGuide: Story = {
  args: {
    renderContent: (
      <p style={{ fontSize: 13, color: 'var(--font-color-muted, #888)', textAlign: 'center' }}>
        숫자 6자리를 입력하세요
      </p>
    ),
  },
};

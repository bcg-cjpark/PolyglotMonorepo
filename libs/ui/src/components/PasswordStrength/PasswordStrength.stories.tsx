import type { Meta, StoryObj } from '@storybook/react-vite';
import { PasswordStrength, type PasswordStrengthDisplay } from './PasswordStrength';

const buildStrength = (
  score: 0 | 1 | 2 | 3 | 4,
  overrides: Partial<PasswordStrengthDisplay> = {},
): PasswordStrengthDisplay => {
  const presets: Record<0 | 1 | 2 | 3 | 4, PasswordStrengthDisplay> = {
    0: {
      score: 0,
      label: '매우 약함',
      color: 'text-red-red800',
      progressColor: 'bg-red-red800',
      feedback: ['8자 이상 사용하세요', '특수문자를 포함하세요'],
      crackTime: '즉시 해독 가능',
    },
    1: {
      score: 1,
      label: '약함',
      color: 'text-red-red500',
      progressColor: 'bg-red-red500',
      feedback: ['대소문자를 조합하세요', '숫자를 포함하세요'],
      crackTime: '수 분 내 해독 가능',
    },
    2: {
      score: 2,
      label: '보통',
      color: 'text-primary-primary800',
      progressColor: 'bg-primary-primary800',
      feedback: ['조금 더 길게 만들어 주세요'],
      crackTime: '수 시간',
    },
    3: {
      score: 3,
      label: '강함',
      color: 'text-green-green500',
      progressColor: 'bg-green-green500',
      feedback: ['좋은 비밀번호입니다'],
      crackTime: '수 개월',
    },
    4: {
      score: 4,
      label: '매우 강함',
      color: 'text-green-green800',
      progressColor: 'bg-green-green800',
      feedback: [],
      crackTime: '수백 년',
    },
  };
  return { ...presets[score], ...overrides };
};

const meta: Meta<typeof PasswordStrength> = {
  title: 'Components/PasswordStrength',
  component: PasswordStrength,
  tags: ['autodocs'],
  argTypes: {
    showLabel: { control: 'boolean' },
    showDetails: { control: 'boolean' },
    // strength 는 복합 객체라 argTypes 에서 개별 필드로 제어 불가.
    // 각 story 의 args 로 주입.
    strength: { control: false },
  },
  args: {
    showLabel: true,
    showDetails: false,
    strength: buildStrength(2),
  },
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PasswordStrength>;

export const Default: Story = {};

export const VeryWeak: Story = {
  args: { strength: buildStrength(0) },
};

export const Weak: Story = {
  args: { strength: buildStrength(1) },
};

export const Medium: Story = {
  args: { strength: buildStrength(2) },
};

export const Strong: Story = {
  args: { strength: buildStrength(3) },
};

export const VeryStrong: Story = {
  args: { strength: buildStrength(4) },
};

export const WithDetails: Story = {
  args: {
    strength: buildStrength(1),
    showDetails: true,
  },
};

export const AllLevels: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 360 }}>
      {([0, 1, 2, 3, 4] as const).map((s) => (
        <div key={s}>
          <div style={{ fontSize: 12, marginBottom: 4 }}>score = {s}</div>
          <PasswordStrength strength={buildStrength(s)} showLabel />
        </div>
      ))}
    </div>
  ),
};

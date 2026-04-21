import type { Meta, StoryObj } from '@storybook/react-vite';
import type { IconName } from '#/types/icons';
import { Icon } from './Icon';

// IconName 전체는 200+ 개라 argTypes 에는 대표 세트만 노출.
// 전체 갤러리는 AllIcons 스토리에서 렌더.
const ICON_OPTIONS: IconName[] = [
  'arrow-forward',
  'arrow-backward',
  'arrow-up',
  'arrow-down',
  'plus',
  'minus',
  'edit',
  'trash',
  'refresh',
  'search',
  'eye',
  'eye-close',
  'home',
  'settings',
  'person',
  'notification',
  'warning',
  'info',
  'check-circle',
  'heart',
  'star',
  'close',
  'download',
  'upload',
];

const GALLERY_ICONS: IconName[] = [
  'arrow-forward',
  'arrow-backward',
  'arrow-up',
  'arrow-down',
  'arrow-close',
  'arrow-open',
  'plus',
  'minus',
  'edit',
  'trash',
  'refresh',
  'search',
  'eye',
  'eye-close',
  'copy',
  'download',
  'upload',
  'send',
  'delete',
  'save',
  'home',
  'settings',
  'person',
  'login',
  'logout',
  'mypage',
  'phone',
  'notification',
  'mode-dark',
  'mode-light',
  'warning',
  'warning2',
  'info',
  'check-sm',
  'check-circle',
  'heart',
  'heart-thin',
  'star',
  'favorite',
  'calendar',
  'email',
  'time',
  'filter',
  'card',
  'close',
  'trending-up',
  'trending-down',
  'dollar',
];

const meta: Meta<typeof Icon> = {
  title: 'Components/Icon',
  component: Icon,
  tags: ['autodocs'],
  argTypes: {
    name: {
      control: 'select',
      options: ICON_OPTIONS,
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl', 16, 24, 32, 48],
    },
    color: { control: 'color' },
    className: { control: 'text' },
  },
  args: {
    name: 'home',
    size: 'md',
    color: 'currentColor',
  },
};

export default meta;
type Story = StoryObj<typeof Icon>;

export const Default: Story = {};

export const Small: Story = {
  args: { size: 'sm' },
};

export const Large: Story = {
  args: { size: 'lg' },
};

export const ExtraLarge: Story = {
  args: { size: 'xl' },
};

export const Colored: Story = {
  args: { color: '#ef4444', name: 'heart', size: 'lg' },
};

export const NumericSize: Story = {
  args: { size: 48, name: 'star', color: '#f59e0b' },
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((s) => (
        <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Icon name="settings" size={s} />
          <span style={{ fontSize: 12, marginTop: 4 }}>{s}</span>
        </div>
      ))}
    </div>
  ),
};

export const AllIcons: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: 16,
        maxWidth: 720,
      }}
    >
      {GALLERY_ICONS.map((n) => (
        <div
          key={n}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            padding: 8,
            border: '1px solid #e5e7eb',
            borderRadius: 6,
          }}
        >
          <Icon name={n} size="md" />
          <span style={{ fontSize: 10, textAlign: 'center', wordBreak: 'break-all' }}>{n}</span>
        </div>
      ))}
    </div>
  ),
};

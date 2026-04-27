import reactInternal from '@monorepo/eslint-config/react-internal';

export default [
  ...reactInternal,
  {
    ignores: [
      'dist/**',
      'playwright-report/**',
      'test-results/**',
      'tsconfig.tsbuildinfo',
    ],
  },
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    rules: {
      // `@monorepo/ui` primitive (Input, Textarea 등) 는 내부적으로 form control 을 렌더하지만
      // jsx-a11y 규칙은 커스텀 컴포넌트를 기본적으로 control 로 인식하지 못한다.
      // 프로젝트에서 `<label>` 로 감싸는 패턴을 일관되게 쓰고 있어 실제 a11y 는 보장되므로
      // 플러그인에 control 로 볼 컴포넌트명을 알려준다.
      'jsx-a11y/label-has-associated-control': [
        'error',
        {
          controlComponents: ['Input', 'Textarea', 'Checkbox', 'RadioGroup'],
          depth: 3,
        },
      ],
    },
  },
];

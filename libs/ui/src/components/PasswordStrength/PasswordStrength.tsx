import { ProgressBar } from '#/components/ProgressBar';
import { memo } from 'react';

export interface PasswordStrengthDisplay {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
  progressColor: string;
  feedback: string[];
  crackTime: string;
}

export interface PasswordStrengthProps {
  /** 비밀번호 강도 정보 */
  strength: PasswordStrengthDisplay;
  /** 라벨 표시 여부 */
  showLabel?: boolean;
  /** 상세 피드백 표시 여부 */
  showDetails?: boolean;
}

export const PasswordStrength = memo(function PasswordStrength({
  strength,
  showLabel = true,
  showDetails = false,
}: PasswordStrengthProps) {
  return (
    <div className="base-password-strength">
      <ProgressBar
        variant="password-strength"
        strengthScore={strength.score}
        showLabel={showLabel}
      />

      {showDetails && strength.feedback.length > 0 && (
        <div className="base-password-strength__details">
          {strength.feedback.map((fb, index) => (
            <div key={index} className="base-password-strength__feedback text-neutral600">
              {fb}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

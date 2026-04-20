import { Icon } from '#/components/Icon';
import { memo, useCallback, useEffect, useRef, useState } from 'react';

export interface FileUploadButtonProps {
  /** 버튼 텍스트 */
  label?: string;
  /** 버튼 상태 */
  status?: 'default' | 'hover';
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 아이콘 표시 여부 */
  showIcon?: boolean;
  /** 다중 파일 선택 여부 */
  multiple?: boolean;
  /** 허용할 파일 타입 */
  accept?: string;
  /** 최대 파일 크기 (바이트, 기본 10MB) */
  maxFileSize?: number;
  /** 초기 파일 목록 */
  initialFiles?: File[];
  /** 버튼 클릭 시 */
  onClick?: (e: React.MouseEvent) => void;
  /** 파일 선택 시 */
  onChange?: (files: FileList | null) => void;
  /** 파일 제거 시 */
  onRemove?: (file: File) => void;
  /** 파일 선택/제거 시 현재 파일 목록 */
  onFileSelected?: (files: File[]) => void;
  /** 파일 크기 초과 시 */
  onFileSizeError?: (file: File, maxSize: number) => void;
  /** 허용되지 않는 파일 형식 시 */
  onFileTypeError?: (file: File, allowedTypes: string[]) => void;
}

const ALLOWED_TYPES = ['png', 'jpg', 'jpeg', 'pdf'];

export const FileUploadButton = memo(function FileUploadButton({
  label = '파일선택',
  status = 'default',
  disabled = false,
  showIcon = true,
  multiple = false,
  accept = '.png,.jpg,.jpeg,.pdf',
  maxFileSize = 10 * 1024 * 1024,
  initialFiles = [],
  onClick,
  onChange,
  onRemove,
  onFileSelected,
  onFileSizeError,
  onFileTypeError,
}: FileUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>(initialFiles);

  useEffect(() => {
    if (initialFiles.length > 0) {
      setSelectedFiles([...initialFiles]);
    }
  }, [initialFiles]);

  const hasSelectedFiles = selectedFiles.length > 0;

  const staticClasses = [
    'relative w-full flex items-center rounded-sm border transition-colors duration-150',
    'bg-[#f3f4f6]',
    'border-bg-bg-outline',
    'text-input-text-static',
    disabled ? 'cursor-not-allowed opacity-60' : 'hover:bg-bg-surface',
  ].join(' ');

  const dynamicStyle: React.CSSProperties = disabled
    ? {
        backgroundColor: 'var(--button-disabled-background)',
        borderColor: 'var(--button-disabled-border)',
        color: 'var(--button-disabled-text)',
      }
    : status === 'hover'
      ? { backgroundColor: 'var(--base-colors-common-bg-surface-default)' }
      : {};

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;
      onClick?.(e);
      inputRef.current?.click();
    },
    [disabled, onClick]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      const validFiles: File[] = [];

      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop()?.toLowerCase() || '';

        if (!ALLOWED_TYPES.includes(ext)) {
          onFileTypeError?.(file, ALLOWED_TYPES);
          continue;
        }

        if (file.size > maxFileSize) {
          onFileSizeError?.(file, maxFileSize);
          continue;
        }

        validFiles.push(file);
      }

      setSelectedFiles(validFiles);
      onChange?.(files);
      onFileSelected?.(validFiles);

      // input 리셋 (같은 파일 재선택 허용)
      e.target.value = '';
    },
    [maxFileSize, onChange, onFileSelected, onFileSizeError, onFileTypeError]
  );

  const removeFile = useCallback(
    (file: File) => {
      setSelectedFiles((prev) => {
        const next = prev.filter((f) => !(f.name === file.name && f.size === file.size));
        onFileSelected?.([]);
        return next;
      });
      onRemove?.(file);
    },
    [onRemove, onFileSelected]
  );

  if (hasSelectedFiles) {
    return (
      <div>
        {selectedFiles.map((file, index) => (
          <div
            key={`${file.name}-${index}`}
            className="flex w-full items-center justify-between rounded-sm border border-gray-200 bg-gray-50 px-4 py-[11px]"
          >
            <span className="text-blue truncate text-sm underline underline-offset-1">
              {file.name}
            </span>
            <button
              type="button"
              onClick={() => removeFile(file)}
              className="ml-2 flex-shrink-0 text-gray-400 transition-colors duration-150 hover:text-red-500"
              title="파일 제거"
            >
              <Icon name="close" size="sm" />
            </button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <button
      type="button"
      className={staticClasses}
      style={dynamicStyle}
      disabled={disabled}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        disabled={disabled}
        multiple={multiple}
        accept={accept}
        onChange={handleChange}
      />
      <span className="flex w-full flex-row items-center justify-center gap-1 px-6 py-3.5">
        <span className="text-sm font-normal">{label}</span>
        {showIcon && (
          <Icon name="upload" size="sm" color={disabled ? 'primary' : 'currentColor'} />
        )}
      </span>
    </button>
  );
});

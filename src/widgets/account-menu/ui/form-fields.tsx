import type { FieldError, UseFormRegisterReturn } from 'react-hook-form';

interface FieldProps {
  label: string;
  type?: 'text' | 'email' | 'password';
  autoComplete?: string;
  placeholder?: string;
  readOnly?: boolean;
  value?: string;
  registration?: UseFormRegisterReturn;
  error?: FieldError | undefined;
}

export function FormField({
  label,
  type = 'text',
  autoComplete,
  placeholder,
  readOnly,
  value,
  registration,
  error,
}: FieldProps) {
  const errorId = registration ? `${registration.name}-error` : undefined;
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-200">
      {label}
      <input
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        readOnly={readOnly}
        value={value}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className="h-11 rounded-lg border border-zinc-300 bg-white px-3 text-zinc-950 outline-none placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        {...registration}
      />
      {error && (
        <span
          id={errorId}
          role="alert"
          className="text-xs font-normal text-red-600 dark:text-red-400"
        >
          {error.message}
        </span>
      )}
    </label>
  );
}

export const primaryButton =
  'flex h-11 w-full items-center justify-center rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60';
export const secondaryButton =
  'flex h-11 w-full items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800';

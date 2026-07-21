import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useSession } from '@/entities/session';
import { getApiErrorDescription } from '@/shared/lib/errors';
import { useI18n } from '@/shared/lib/i18n';
import { FormField, primaryButton, secondaryButton } from './form-fields';

interface Props {
  onBack: () => void;
}

export function PasswordResetForm({ onBack }: Props) {
  const { t } = useI18n();
  const requestPasswordReset = useSession((state) => state.requestPasswordReset);
  const schema = z.object({ email: z.email(t('validation.email')) });
  type Values = z.infer<typeof schema>;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitSuccessful, isSubmitting },
    setError,
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const submit = handleSubmit(async ({ email }) => {
    try {
      await requestPasswordReset(email.trim());
    } catch (error) {
      setError('root', { message: getApiErrorDescription(error, t('account.genericError')) });
    }
  });

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <h2 className="text-lg font-semibold">{t('account.resetPassword')}</h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        {t('account.resetPasswordDescription')}
      </p>
      <FormField
        label={t('account.email')}
        type="email"
        autoComplete="email"
        placeholder="user@example.com"
        registration={register('email')}
        error={errors.email}
      />
      {errors.root && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {errors.root.message}
        </p>
      )}
      {isSubmitSuccessful && !errors.root && (
        <p role="status" className="text-sm text-emerald-700 dark:text-emerald-400">
          {t('account.resetPasswordSent')}
        </p>
      )}
      <button className={primaryButton} type="submit" disabled={isSubmitting}>
        {isSubmitting ? t('common.loading') : t('account.sendResetLink')}
      </button>
      <button className={secondaryButton} type="button" onClick={onBack} disabled={isSubmitting}>
        {t('common.back')}
      </button>
    </form>
  );
}

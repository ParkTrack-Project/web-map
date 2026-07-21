import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { useSession } from '@/entities/session';
import { getApiErrorDescription } from '@/shared/lib/errors';
import { useI18n } from '@/shared/lib/i18n';
import { FormField, primaryButton, secondaryButton } from './form-fields';

interface Props {
  onBack: () => void;
}

export function ProfileForm({ onBack }: Props) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { t } = useI18n();
  const user = useSession((state) => state.user)!;
  const updateName = useSession((state) => state.updateName);
  const logout = useSession((state) => state.logout);
  const schema = z.object({ fullName: z.string().min(1, t('validation.required')) });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<{ fullName: string }>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: user.full_name ?? '' },
  });

  const submit = handleSubmit(async ({ fullName }) => {
    try {
      await updateName(fullName.trim());
      toast.success(t('account.saveSuccess'));
      onBack();
    } catch (error) {
      setError('root', { message: getApiErrorDescription(error, t('account.genericError')) });
    }
  });

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <h2 className="text-lg font-semibold">{t('account.profile')}</h2>
      <FormField
        label={t('account.name')}
        autoComplete="name"
        registration={register('fullName')}
        error={errors.fullName}
      />
      <FormField label={t('account.email')} type="email" value={user.email} readOnly />
      {errors.root && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {errors.root.message}
        </p>
      )}
      <button className={primaryButton} type="submit" disabled={isSubmitting}>
        {isSubmitting ? t('common.loading') : t('common.save')}
      </button>
      <button className={secondaryButton} type="button" onClick={onBack} disabled={isSubmitting}>
        {t('common.cancel')}
      </button>
      <button
        type="button"
        disabled={isSubmitting || isLoggingOut}
        onClick={async () => {
          if (isLoggingOut) return;
          setIsLoggingOut(true);
          try {
            await logout();
            toast.success(t('account.signOutSuccess'));
            onBack();
          } finally {
            setIsLoggingOut(false);
          }
        }}
        className="flex h-11 items-center justify-center rounded-lg border border-red-300 bg-red-50 px-4 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
      >
        {isLoggingOut ? t('common.loading') : t('account.signOut')}
      </button>
    </form>
  );
}

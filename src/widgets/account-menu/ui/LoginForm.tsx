import { zodResolver } from '@hookform/resolvers/zod';
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

export function LoginForm({ onBack }: Props) {
  const { t } = useI18n();
  const login = useSession((state) => state.login);
  const schema = z.object({
    login: z.string().min(1, t('validation.required')),
    password: z.string().min(1, t('validation.required')),
  });
  type Values = z.infer<typeof schema>;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { login: '', password: '' },
  });

  const submit = handleSubmit(async (values) => {
    try {
      await login(values);
      toast.success(t('account.signInSuccess'));
      onBack();
    } catch (error) {
      setError('root', { message: getApiErrorDescription(error, t('account.genericError')) });
    }
  });

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <h2 className="text-lg font-semibold">{t('account.signIn')}</h2>
      <FormField
        label={t('account.email')}
        placeholder={t('account.loginPlaceholder')}
        autoComplete="username"
        registration={register('login')}
        error={errors.login}
      />
      <FormField
        label={t('account.password')}
        type="password"
        autoComplete="current-password"
        registration={register('password')}
        error={errors.password}
      />
      {errors.root && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {errors.root.message}
        </p>
      )}
      <button className={primaryButton} type="submit" disabled={isSubmitting}>
        {isSubmitting ? t('common.loading') : t('account.signIn')}
      </button>
      <button className={secondaryButton} type="button" onClick={onBack} disabled={isSubmitting}>
        {t('common.cancel')}
      </button>
    </form>
  );
}

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

export function RegisterForm({ onBack }: Props) {
  const { t } = useI18n();
  const registerUser = useSession((state) => state.register);
  const schema = z
    .object({
      full_name: z.string().min(1, t('validation.required')),
      email: z.email(t('validation.email')),
      password: z.string().min(8, t('validation.password')),
      confirmPassword: z.string().min(1, t('validation.required')),
    })
    .refine((values) => values.password === values.confirmPassword, {
      path: ['confirmPassword'],
      message: t('validation.passwordMismatch'),
    });
  type Values = z.infer<typeof schema>;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: '', email: '', password: '', confirmPassword: '' },
  });

  const submit = handleSubmit(async (values) => {
    try {
      await registerUser({
        email: values.email,
        password: values.password,
        full_name: values.full_name,
      });
      toast.success(t('account.registerSuccess'));
      onBack();
    } catch (error) {
      setError('root', { message: getApiErrorDescription(error, t('account.genericError')) });
    }
  });

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <h2 className="text-lg font-semibold">{t('account.create')}</h2>
      <FormField
        label={t('account.name')}
        autoComplete="name"
        registration={register('full_name')}
        error={errors.full_name}
      />
      <FormField
        label={t('account.email')}
        type="email"
        autoComplete="email"
        registration={register('email')}
        error={errors.email}
      />
      <FormField
        label={t('account.password')}
        type="password"
        autoComplete="new-password"
        registration={register('password')}
        error={errors.password}
      />
      <FormField
        label={t('account.confirmPassword')}
        type="password"
        autoComplete="new-password"
        registration={register('confirmPassword')}
        error={errors.confirmPassword}
      />
      {errors.root && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {errors.root.message}
        </p>
      )}
      <button className={primaryButton} type="submit" disabled={isSubmitting}>
        {isSubmitting ? t('common.loading') : t('account.create')}
      </button>
      <button className={secondaryButton} type="button" onClick={onBack} disabled={isSubmitting}>
        {t('common.cancel')}
      </button>
    </form>
  );
}

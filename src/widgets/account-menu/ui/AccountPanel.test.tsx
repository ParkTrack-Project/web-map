import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/shared/lib/i18n';
import { usePreferences } from '@/features/preferences';
import { useSession } from '@/entities/session';
import { writeSession } from '@/shared/lib/session';
import { AccountPanel } from './AccountPanel';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ProfileForm } from './ProfileForm';

function wrap(node: React.ReactNode) {
  return render(<I18nProvider>{node}</I18nProvider>);
}

describe('account panel', () => {
  beforeEach(() => {
    localStorage.clear();
    writeSession(null);
    usePreferences.setState({ theme: 'light', language: 'ru' });
    useSession.setState({ status: 'unauthenticated', user: null });
  });

  it('shows unauthenticated actions in Russian and English', () => {
    const { rerender } = wrap(<AccountPanel onNavigate={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Войти' })).toBeInTheDocument();
    usePreferences.setState({ language: 'en' });
    rerender(
      <I18nProvider>
        <AccountPanel onNavigate={vi.fn()} />
      </I18nProvider>,
    );
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument();
  });

  it('shows authorized card and localized missing name', () => {
    useSession.setState({
      status: 'authenticated',
      user: { id: '1', email: 'user@example.com', full_name: null },
    });
    wrap(<AccountPanel onNavigate={vi.fn()} />);
    expect(screen.getByText('Имя не указано')).toBeInTheDocument();
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
  });

  it('signs in successfully', async () => {
    const onBack = vi.fn();
    wrap(<LoginForm onBack={onBack} />);
    await userEvent.type(screen.getByPlaceholderText('Email или логин'), 'person@example.com');
    await userEvent.type(screen.getByLabelText('Пароль'), 'password');
    await userEvent.click(screen.getByRole('button', { name: 'Войти' }));
    await waitFor(() => expect(useSession.getState().status).toBe('authenticated'));
    expect(useSession.getState().user?.email).toBe('person@example.com');
    expect(onBack).toHaveBeenCalled();
  });

  it('registers successfully', async () => {
    wrap(<RegisterForm onBack={vi.fn()} />);
    await userEvent.type(screen.getByLabelText('Имя'), 'Анна');
    await userEvent.type(screen.getByLabelText('Email'), 'anna@example.com');
    const passwordFields = screen.getAllByLabelText(/Пароль|Подтвердите пароль/);
    await userEvent.type(passwordFields[0]!, 'password1');
    await userEvent.type(passwordFields[1]!, 'password1');
    fireEvent.submit(screen.getByRole('button', { name: 'Регистрация' }).closest('form')!);
    await waitFor(() => expect(useSession.getState().user?.full_name).toBe('Анна'));
  });

  it('updates the name immediately and signs out', async () => {
    writeSession({
      accessToken: 'mock-access-token',
      user: { id: '1', email: 'demo@parktrack.live', full_name: 'Old' },
    });
    useSession.setState({
      status: 'authenticated',
      user: { id: '1', email: 'demo@parktrack.live', full_name: 'Old' },
    });
    const { unmount } = wrap(<ProfileForm onBack={vi.fn()} />);
    const name = screen.getByLabelText('Имя');
    await userEvent.clear(name);
    await userEvent.type(name, 'Новое имя');
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }));
    await waitFor(() => expect(useSession.getState().user?.full_name).toBe('Новое имя'));
    unmount();
    wrap(<ProfileForm onBack={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Выйти из аккаунта' }));
    await waitFor(() => expect(useSession.getState().status).toBe('unauthenticated'));
    expect(localStorage.getItem('parktrack:session:v1')).toBeNull();
  });
});

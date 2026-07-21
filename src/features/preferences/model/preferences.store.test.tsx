import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { PreferencesProvider } from '../ui/PreferencesProvider';
import { PREFERENCES_STORAGE_KEY, usePreferences } from './preferences.store';

describe('preferences', () => {
  beforeEach(() => {
    localStorage.clear();
    usePreferences.setState({ theme: 'light', language: 'ru' });
  });

  it('persists theme and applies it to the document', async () => {
    render(
      <PreferencesProvider>
        <div />
      </PreferencesProvider>,
    );
    act(() => usePreferences.getState().setTheme('dark'));
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('dark'));
    expect(JSON.parse(localStorage.getItem(PREFERENCES_STORAGE_KEY) ?? '{}')).toMatchObject({
      theme: 'dark',
    });
  });

  it('persists language and updates document.lang without reload in tests', async () => {
    render(
      <PreferencesProvider>
        <div />
      </PreferencesProvider>,
    );
    act(() => usePreferences.getState().setLanguage('en', false));
    await waitFor(() => expect(document.documentElement.lang).toBe('en'));
    expect(JSON.parse(localStorage.getItem(PREFERENCES_STORAGE_KEY) ?? '{}')).toMatchObject({
      language: 'en',
    });
  });
});

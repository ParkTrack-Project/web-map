// Phase 4 / D-06 / SEARCH-02 (TDD).
// - listbox + option roles
// - click → onSelect(suggestion)
// - empty state
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SuggestionsList } from './SuggestionsList';
import type { SuggestResult } from '@/shared/lib/yandex';

const fakeResults: SuggestResult[] = [
  {
    title: { text: 'Кронверкский пр., 49' },
    subtitle: { text: 'Санкт-Петербург' },
    uri: 'ymapsbm1://geo?id=1',
  },
  {
    title: { text: 'Кронверкский пр., 51' },
    subtitle: { text: 'Санкт-Петербург' },
    uri: 'ymapsbm1://geo?id=2',
  },
];

describe('SuggestionsList (D-06)', () => {
  it('renders <ul role="listbox">', () => {
    render(<SuggestionsList results={fakeResults} onSelect={() => {}} />);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });
  it('каждый item имеет role="option"', () => {
    render(<SuggestionsList results={fakeResults} onSelect={() => {}} />);
    expect(screen.getAllByRole('option')).toHaveLength(2);
  });
  it('click → onSelect(suggestion)', () => {
    const onSelect = vi.fn();
    render(<SuggestionsList results={fakeResults} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Кронверкский пр., 49'));
    expect(onSelect).toHaveBeenCalledWith(fakeResults[0]);
  });
  it('selects the exact item when two suggestions have the same title and uri', () => {
    const onSelect = vi.fn();
    const sameNameResults: SuggestResult[] = [
      {
        title: { text: 'Авито' },
        subtitle: { text: 'Лесная улица, 22, Петрозаводск' },
        uri: 'Авито',
        coords: [61.8, 34.3],
      },
      {
        title: { text: 'Авито' },
        subtitle: { text: 'Невский проспект, 1, Санкт-Петербург' },
        uri: 'Авито',
        coords: [59.9, 30.3],
      },
    ];
    render(<SuggestionsList results={sameNameResults} onSelect={onSelect} />);

    fireEvent.click(screen.getByText('Невский проспект, 1, Санкт-Петербург'));
    expect(onSelect).toHaveBeenCalledWith(sameNameResults[1]);
  });
  it('uses readable hover and focus colors in the dark theme', () => {
    render(<SuggestionsList results={fakeResults} onSelect={() => {}} />);
    expect(screen.getAllByRole('option')[0]).toHaveClass(
      'dark:hover:bg-zinc-800',
      'dark:focus:bg-zinc-800',
    );
  });
  it('shows empty state когда results=[] и нет error', () => {
    render(<SuggestionsList results={[]} onSelect={() => {}} />);
    expect(screen.getByText(/Начните вводить адрес/i)).toBeInTheDocument();
  });
});

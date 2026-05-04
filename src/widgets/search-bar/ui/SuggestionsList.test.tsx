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
  it('shows empty state когда results=[] и нет error', () => {
    render(<SuggestionsList results={[]} onSelect={() => {}} />);
    expect(screen.getByText(/Начните вводить адрес/i)).toBeInTheDocument();
  });
});

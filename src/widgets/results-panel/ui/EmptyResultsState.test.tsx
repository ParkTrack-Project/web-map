import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyResultsState } from './EmptyResultsState';

describe('EmptyResultsState (D-44)', () => {
  it('shows D-44 текст', () => {
    render(
      <EmptyResultsState
        activeFiltersCount={0}
        onResetFilters={() => {}}
        onCloseResults={() => {}}
      />,
    );
    expect(screen.getByText(/Подходящих парковок не найдено в радиусе/)).toBeInTheDocument();
  });
  it('hides reset button когда activeFiltersCount=0', () => {
    render(
      <EmptyResultsState
        activeFiltersCount={0}
        onResetFilters={() => {}}
        onCloseResults={() => {}}
      />,
    );
    expect(screen.queryByRole('button', { name: /Сбросить фильтры/ })).not.toBeInTheDocument();
  });
  it('shows reset button когда activeFiltersCount>0', () => {
    render(
      <EmptyResultsState
        activeFiltersCount={3}
        onResetFilters={() => {}}
        onCloseResults={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: /Сбросить фильтры/ })).toBeInTheDocument();
  });
  it('shows close button always', () => {
    render(
      <EmptyResultsState
        activeFiltersCount={0}
        onResetFilters={() => {}}
        onCloseResults={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: /Закрыть результаты/ })).toBeInTheDocument();
  });
});

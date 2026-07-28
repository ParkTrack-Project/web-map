export const RESULTS_SHEET_RESIZE_EVENT = 'parktrack:results-sheet-resize';

export interface ResultsSheetResizeDetail {
  final: boolean;
}

export function notifyResultsSheetResize(final: boolean): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<ResultsSheetResizeDetail>(RESULTS_SHEET_RESIZE_EVENT, {
      detail: { final },
    }),
  );
}

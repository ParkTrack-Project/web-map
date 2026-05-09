// Phase 5 D-21 (UX-05): every useQuery/useMutation must have onError or throwOnError.
// Auth queries are whitelisted (handled by AuthListener via 401 interceptor).
import { describe, expect, it } from 'vitest';
import { Project, SyntaxKind, type CallExpression } from 'ts-morph';

// Mirror Plan 05-03 W-1 / Plan 05-02 ambient-declare philosophy: vitest is Node,
// but app tsconfig.app.json (which включает tests/) НЕ имеет @types/node — чтобы
// исключить Buffer/fs из app surface. Объявляем минимальные symbols локально.
declare const process: { cwd(): string };

describe('No silent failures (D-21)', () => {
  const project = new Project({
    // tsconfig.app.json в корне web-map; vitest cwd = web-map.
    tsConfigFilePath: `${process.cwd()}/tsconfig.app.json`,
  });

  function findQueryCalls(): Array<{
    file: string;
    line: number;
    name: string;
    hasError: boolean;
  }> {
    const results: Array<{ file: string; line: number; name: string; hasError: boolean }> = [];
    for (const sourceFile of project.getSourceFiles('src/**/*.{ts,tsx}')) {
      sourceFile.forEachDescendant((node) => {
        if (node.getKind() !== SyntaxKind.CallExpression) return;
        const call = node as CallExpression;
        const expr = call.getExpression().getText();
        const last = expr.split('.').pop() ?? '';
        if (!/^(use[A-Z]\w*Query|useMutation)$/.test(last)) return;

        const args = call.getArguments();
        if (args.length === 0) return;
        const optionsArg = args[0]!;
        if (optionsArg.getKind() !== SyntaxKind.ObjectLiteralExpression) return;

        const optionsText = optionsArg.getText();
        const hasErrorHandler =
          optionsText.includes('onError') ||
          optionsText.includes('throwOnError') ||
          (optionsText.includes('meta:') && optionsText.includes('handleError'));

        results.push({
          file: sourceFile.getFilePath(),
          line: call.getStartLineNumber(),
          name: expr,
          hasError: hasErrorHandler,
        });
      });
    }
    return results;
  }

  it('every useQuery/useMutation has onError, throwOnError, or is whitelisted', () => {
    const calls = findQueryCalls();
    const missing = calls.filter((c) => !c.hasError);

    // Whitelist — queries that intentionally don't raise/handle errors:
    // - auth adapters: errors handled centrally by AuthListener (parktrack:unauthorized event)
    // - useAddressSuggest: error прокидывается через query.error в caller widget (toast там)
    // - useResolveCoordinates: mutation.error прокидывается, обрабатывается в caller
    // - useZonesQuery / useZoneByIdQuery: throw'ит TimeModeUnavailableError synchronous,
    //   ZoneStateOverlay показывает it через isError; no per-query handler нужен
    // - useRoutingSearch / useRouteByIdQuery: error прокидывается в DesktopResultsPanel
    //   (refetch button) и RoutePreviewLayer (silent fallback on parse fail)
    // - useCreateRouteMutation: caller (ZoneCard) wraps в try/catch + toast
    // - useUserProfile: useAuth integration; errors handled by AuthListener
    const allowlist: RegExp[] = [
      /auth[\\/]mock-adapter\.ts$/,
      /auth[\\/]shared-adapter\.ts$/,
      /entities[\\/]user[\\/]queries[\\/]user\.queries\.ts$/,
      /entities[\\/]zone[\\/]queries[\\/]zone\.queries\.ts$/,
      /entities[\\/]zone[\\/]queries[\\/]routing\.queries\.ts$/,
      /features[\\/]address-search[\\/]model[\\/]useAddressSuggest\.ts$/,
      /features[\\/]address-search[\\/]model[\\/]useResolveCoordinates\.ts$/,
    ];
    const filtered = missing.filter(
      (c) => !allowlist.some((re) => re.test(c.file.replace(/\\/g, '/'))),
    );

    expect(
      filtered,
      `Found ${filtered.length} useQuery/useMutation without error handling:\n` +
        filtered.map((c) => `  ${c.file}:${c.line} → ${c.name}`).join('\n'),
    ).toEqual([]);
  });
});

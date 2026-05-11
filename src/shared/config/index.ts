export * from './env';
export * from './constants';
export * from './zone-palette';
// Phase 5 D-12: brand-tokens unifies Phase 2 zone-palette + Phase 4 brand hex'ы.
// Re-exports zonePalette+CONFIDENCE_THRESHOLD из zone-palette внутри для backward compat;
// порядок exports выше сохранён, чтобы старые импорты не сломались.
export { brand } from './brand-tokens';
export { Z_INDEX, type ZIndexKey } from './zindex';

let _ruPR: Intl.PluralRules | null = null;
function getPR(): Intl.PluralRules {
  if (!_ruPR) _ruPR = new Intl.PluralRules('ru');
  return _ruPR;
}

export interface RuForms {
  one: string;
  few: string;
  many: string;
}

export function pluralizeRu(n: number, forms: RuForms): string {
  const cat = getPR().select(n);
  switch (cat) {
    case 'one':
      return forms.one;
    case 'few':
      return forms.few;
    case 'other':
      // CLDR 'other' для русского срабатывает только на нецелых.
      // Речевая норма: «1,5 места» / «2,7 литра» — родительный единственный = "few".
      return forms.few;
    // 'many', 'zero', 'two' — всё в "many".
    default:
      return forms.many;
  }
}

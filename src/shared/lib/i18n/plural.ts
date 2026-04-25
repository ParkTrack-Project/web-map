// CARD-06: Русская плюрализация через Intl.PluralRules.
// Russian forms (CLDR cardinal):
//   one  — 1, 21, 31, ... но НЕ 11 (mod 10 == 1, mod 100 != 11)
//   few  — 2-4, 22-24, ... но НЕ 12-14 (mod 10 ∈ {2,3,4}, mod 100 ∉ {12,13,14})
//   many — 0, 5-20, 25-30, ...
//   other — все нецелые числа (CLDR трактует "1,5 литра" как 'other').
//
// CARD-06 трактовка: для нашего use-case «N мест» нецелые числа должны звучать
// как «1.5 места» (родительный падеж единственного числа = форма "few" в RU).
// CLDR категория 'other' для нецелых маппится на 'few' — это точное соответствие
// речевой норме («1,5 литра», «2,3 минуты»). Lazy init PluralRules — переиспользуется.
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

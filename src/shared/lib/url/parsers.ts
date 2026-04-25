// Кастомный nuqs-парсер для bbox в URL: ?bbox=w,s,e,n
import { createParser } from 'nuqs';
import { bboxFromString, bboxToString, type Bbox } from '@/shared/lib/geo';

export const parseAsBbox = createParser<Bbox>({
  parse: (v) => bboxFromString(v),
  serialize: (b) => bboxToString(b),
  eq: (a, b) => a.every((v, i) => v === b[i]),
});

// Remove Vietnamese accents from a string
export function removeAccents(str: string): string {
  if (!str) return '';
  return str.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

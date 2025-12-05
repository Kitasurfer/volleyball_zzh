export const generateSlug = (value: string, maxLength = 80): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength);

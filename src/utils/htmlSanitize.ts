/**
 * Escapes HTML special characters to prevent XSS attacks
 * when inserting user-controlled data into HTML templates.
 */
export const escapeHtml = (text: string | null | undefined): string => {
  if (text == null) return '';
  const str = String(text);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

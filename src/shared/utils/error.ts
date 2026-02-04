/**
 * Convertit une erreur inconnue en message affichable.
 */
export function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

// Utilitário para concatenar classes CSS de forma segura
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export default cn; 
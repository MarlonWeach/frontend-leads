export const DEFAULT_LOGIN_REDIRECT = '/dashboard';

const SAFE_REDIRECT_BASE_URL = 'https://frontend-leads.local';

export function sanitizeLoginRedirect(redirectTarget: string | null | undefined): string {
  const candidate = redirectTarget?.trim();

  if (!candidate) {
    return DEFAULT_LOGIN_REDIRECT;
  }

  if (!candidate.startsWith('/') || candidate.startsWith('//') || candidate.includes('\\')) {
    return DEFAULT_LOGIN_REDIRECT;
  }

  try {
    const parsedRedirect = new URL(candidate, SAFE_REDIRECT_BASE_URL);

    if (parsedRedirect.origin !== SAFE_REDIRECT_BASE_URL) {
      return DEFAULT_LOGIN_REDIRECT;
    }

    return `${parsedRedirect.pathname}${parsedRedirect.search}${parsedRedirect.hash}`;
  } catch {
    return DEFAULT_LOGIN_REDIRECT;
  }
}

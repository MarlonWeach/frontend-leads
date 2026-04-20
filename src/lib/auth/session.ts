export const AUTH_COOKIE_KEYS = {
  accessToken: 'lda-access-token',
  refreshToken: 'lda-refresh-token',
} as const;

export const AUTH_TTL_SECONDS = {
  accessToken: 60 * 60, // 1h
  refreshToken: 60 * 60 * 24 * 30, // 30d
} as const;

const AUTH_COOKIE_BASE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
};

type CookieRequestLike = {
  nextUrl?: { protocol?: string };
  headers?: { get: (name: string) => string | null };
};

function isSecureRequest(request?: CookieRequestLike): boolean {
  if (!request) {
    // Fallback conservador para chamadas sem contexto explícito da request.
    return process.env.NODE_ENV === 'production';
  }

  const forwardedProto = request.headers?.get?.('x-forwarded-proto');
  if (forwardedProto) {
    return forwardedProto.split(',')[0].trim() === 'https';
  }

  const protocol = request.nextUrl?.protocol;
  return protocol === 'https:';
}

export function getAuthCookieOptions(request?: CookieRequestLike) {
  return {
    ...AUTH_COOKIE_BASE_OPTIONS,
    secure: isSecureRequest(request),
  };
}

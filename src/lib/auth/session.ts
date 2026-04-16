export const AUTH_COOKIE_KEYS = {
  accessToken: 'lda-access-token',
  refreshToken: 'lda-refresh-token',
} as const;

export const AUTH_TTL_SECONDS = {
  accessToken: 60 * 60, // 1h
  refreshToken: 60 * 60 * 24 * 30, // 30d
} as const;

export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

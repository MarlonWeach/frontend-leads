import { DEFAULT_LOGIN_REDIRECT, sanitizeLoginRedirect } from '@/lib/auth/redirect';

describe('sanitizeLoginRedirect', () => {
  it('keeps same-origin relative redirects', () => {
    expect(sanitizeLoginRedirect('/performance?range=30d#leads')).toBe('/performance?range=30d#leads');
  });

  it('falls back when the redirect is missing or empty', () => {
    expect(sanitizeLoginRedirect(null)).toBe(DEFAULT_LOGIN_REDIRECT);
    expect(sanitizeLoginRedirect('   ')).toBe(DEFAULT_LOGIN_REDIRECT);
  });

  it('rejects absolute and protocol-relative redirects', () => {
    expect(sanitizeLoginRedirect('https://attacker.example/phish')).toBe(DEFAULT_LOGIN_REDIRECT);
    expect(sanitizeLoginRedirect('//attacker.example/phish')).toBe(DEFAULT_LOGIN_REDIRECT);
  });

  it('rejects backslash redirects that browsers may normalize cross-origin', () => {
    expect(sanitizeLoginRedirect('/\\attacker.example')).toBe(DEFAULT_LOGIN_REDIRECT);
  });
});

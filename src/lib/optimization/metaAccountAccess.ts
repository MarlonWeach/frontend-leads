const ACT_PREFIX = /^act_/i;

export function normalizeMetaAccountId(raw: string): string {
  return raw.replace(ACT_PREFIX, '').trim();
}

/**
 * MVP piloto: uma conta permitida via env (32-1 / 32-2).
 * Evoluir para tabela de vínculo usuário↔conta.
 */
export function isPilotMetaAccountAllowed(metaAccountId: string): boolean {
  const allowed =
    process.env.META_ACCOUNT_ID ||
    process.env.NEXT_PUBLIC_META_ACCOUNT_ID ||
    '256925527';
  return normalizeMetaAccountId(metaAccountId) === normalizeMetaAccountId(allowed);
}

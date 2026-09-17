const encoder = new TextEncoder();

export const ADMIN_SESSION_COOKIE = 'admin_session';
export const ADMIN_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

type AdminSessionPayload = {
  version: 1;
  issuedAt: number;
  expiresAt: number;
  nonce: string;
};

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value: string): Uint8Array {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function getSigningKey(secret: string) {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

function getAdminSessionSecret(): string | null {
  const secret = process.env.AUTH_SECRET?.replace(/^["']|["']$/g, '').trim();
  return secret && secret.length >= 32 ? secret : null;
}

export async function createAdminSessionToken(): Promise<string> {
  const secret = getAdminSessionSecret();
  if (!secret) throw new Error('AUTH_SECRET 必须至少包含 32 个字符');

  const now = Math.floor(Date.now() / 1000);
  const payload: AdminSessionPayload = {
    version: 1,
    issuedAt: now,
    expiresAt: now + ADMIN_SESSION_MAX_AGE_SECONDS,
    nonce: crypto.randomUUID(),
  };
  const encodedPayload = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign('HMAC', await getSigningKey(secret), encoder.encode(encodedPayload));
  return `${encodedPayload}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function verifyAdminSessionToken(token: string | undefined): Promise<boolean> {
  const secret = getAdminSessionSecret();
  if (!secret || !token) return false;

  const [encodedPayload, encodedSignature, extra] = token.split('.');
  if (!encodedPayload || !encodedSignature || extra) return false;

  try {
    const validSignature = await crypto.subtle.verify(
      'HMAC',
      await getSigningKey(secret),
      fromBase64Url(encodedSignature),
      encoder.encode(encodedPayload),
    );
    if (!validSignature) return false;

    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(encodedPayload))) as AdminSessionPayload;
    const now = Math.floor(Date.now() / 1000);
    return payload.version === 1 && Number.isFinite(payload.expiresAt) && payload.expiresAt > now;
  } catch {
    return false;
  }
}

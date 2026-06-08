/**
 * Tiny HS256 JWT implementation built on the Web Crypto API so it runs in both
 * the Node.js runtime (route handlers) and the Edge runtime (middleware). No
 * third-party dependency is needed.
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export type JwtPayload = {
  sub: string;
  role: string;
  name: string;
  email?: string;
  permissions?: string[];
  iat: number;
  exp: number;
};

function bytesToBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (let i = 0; i < view.length; i++) binary += String.fromCharCode(view[i]);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function encodeSegment(value: object): string {
  return bytesToBase64Url(encoder.encode(JSON.stringify(value)));
}

async function getKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signToken(
  data: Pick<JwtPayload, "sub" | "role" | "name" | "email" | "permissions">,
  secret: string,
  expiresInSeconds: number,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: JwtPayload = { ...data, iat: now, exp: now + expiresInSeconds };
  const header = encodeSegment({ alg: "HS256", typ: "JWT" });
  const body = encodeSegment(payload);
  const signingInput = `${header}.${body}`;
  const key = await getKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(signingInput));
  return `${signingInput}.${bytesToBase64Url(signature)}`;
}

export async function verifyToken(token: string, secret: string): Promise<JwtPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, body, signature] = parts;
  const signingInput = `${header}.${body}`;

  try {
    const key = await getKey(secret);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlToBytes(signature),
      encoder.encode(signingInput),
    );
    if (!valid) return null;

    const payload = JSON.parse(decoder.decode(base64UrlToBytes(body))) as JwtPayload;
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

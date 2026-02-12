/**
 * Client-side encryption for Diary using Web Crypto API only.
 * PBKDF2-SHA256 for key derivation, AES-GCM-256 for encryption.
 */

const PBKDF2_ITERATIONS = 100_000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const KEY_LENGTH = 256;

function toArrayBufferBackedU8(u8: Uint8Array) {
  const ab = new ArrayBuffer(u8.byteLength);
  new Uint8Array(ab).set(u8);
  return new Uint8Array(ab);
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return typeof btoa !== "undefined"
    ? btoa(binary)
    : Buffer.from(bytes).toString("base64");
}

function base64ToBytes(base64: string): Uint8Array {
  if (typeof atob !== "undefined") {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  return new Uint8Array(Buffer.from(base64, "base64"));
}

export function generateSalt(): Uint8Array {
  const salt = new Uint8Array(SALT_LENGTH);
  crypto.getRandomValues(salt);
  return salt;
}

export function generateIV(): Uint8Array {
  const iv = new Uint8Array(IV_LENGTH);
  crypto.getRandomValues(iv);
  return iv;
}


async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const saltFixed = toArrayBufferBackedU8(salt as Uint8Array);
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltFixed,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt plaintext (UTF-8 string). Returns base64(IV || ciphertext)
 * where ciphertext includes the 16-byte GCM auth tag.
 */
export async function encrypt(
  plaintext: string,
  password: string,
  salt: Uint8Array
): Promise<string> {
  const key = await deriveKey(password, salt);
  const iv = generateIV();
  const ivFixed = toArrayBufferBackedU8(iv as Uint8Array);
  const enc = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: ivFixed,
      tagLength: 128,
    },
    key,
    enc.encode(plaintext)
  );
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return bytesToBase64(combined);
}

/**
 * Decrypt payload produced by encrypt(). Throws on wrong password or tampering.
 */
export async function decrypt(
  base64Payload: string,
  password: string,
  salt: Uint8Array
): Promise<string> {
  const combined = base64ToBytes(base64Payload);
  if (combined.length < IV_LENGTH + 16) {
    throw new Error("Invalid payload");
  }
  const iv = combined.slice(0, IV_LENGTH);
  const ciphertext = combined.slice(IV_LENGTH);
  const key = await deriveKey(password, salt);
  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
      tagLength: 128,
    },
    key,
    ciphertext
  );
  return new TextDecoder().decode(decrypted);
}

export function saltToBase64(salt: Uint8Array): string {
  return bytesToBase64(salt);
}

export function base64ToSalt(base64: string): Uint8Array {
  return base64ToBytes(base64);
}

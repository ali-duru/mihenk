import 'server-only';
import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'node:crypto';

function readKey(name: 'TC_ENCRYPTION_KEY' | 'TC_HASH_KEY'): Buffer {
  const raw = process.env[name];
  if (!raw) throw new Error(`${name} tanımlı değil`);
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) throw new Error(`${name} 32 bayt (base64) olmalı`);
  return key;
}

/** Nüfus müdürlüğü algoritmasıyla TC kimlik no doğrulaması */
export function isValidTc(tc: string): boolean {
  if (!/^[1-9]\d{10}$/.test(tc)) return false;
  const d = tc.split('').map(Number);
  const odd = d[0] + d[2] + d[4] + d[6] + d[8];
  const even = d[1] + d[3] + d[5] + d[7];
  const d10 = (((odd * 7 - even) % 10) + 10) % 10;
  if (d10 !== d[9]) return false;
  const d11 = d.slice(0, 10).reduce((a, b) => a + b, 0) % 10;
  return d11 === d[10];
}

export function encryptTc(tc: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', readKey('TC_ENCRYPTION_KEY'), iv);
  const enc = Buffer.concat([cipher.update(tc, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ['v1', iv.toString('base64'), tag.toString('base64'), enc.toString('base64')].join(':');
}

export function decryptTc(payload: string): string {
  const [v, iv, tag, enc] = payload.split(':');
  if (v !== 'v1') throw new Error('Bilinmeyen şifreleme sürümü');
  const decipher = createDecipheriv('aes-256-gcm', readKey('TC_ENCRYPTION_KEY'), Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(enc, 'base64')), decipher.final()]).toString('utf8');
}

export function hashTc(tc: string): string {
  return createHmac('sha256', readKey('TC_HASH_KEY')).update(tc).digest('hex');
}

export function maskTc(tc: string): string {
  return `${tc.slice(0, 2)}*******${tc.slice(-2)}`;
}

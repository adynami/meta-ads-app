import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { encrypt, decrypt } from './crypto';

const VALID_KEY = 'a'.repeat(64); // 32 bytes in hex

describe('crypto', () => {
  beforeEach(() => {
    process.env.ENCRYPTION_KEY = VALID_KEY;
  });

  afterEach(() => {
    delete process.env.ENCRYPTION_KEY;
  });

  describe('roundtrip', () => {
    it.each([
      ['empty string', ''],
      ['ascii text', 'hello world'],
      ['unicode', '日本語テスト 🎉'],
      ['long string', 'x'.repeat(10_000)],
    ])('%s', (_label, plaintext) => {
      expect(decrypt(encrypt(plaintext))).toBe(plaintext);
    });
  });

  it('produces unique ciphertexts for same plaintext (random IV)', () => {
    const a = encrypt('same');
    const b = encrypt('same');
    expect(a).not.toBe(b);
  });

  describe('missing or invalid key', () => {
    it('throws when ENCRYPTION_KEY is missing', () => {
      delete process.env.ENCRYPTION_KEY;
      expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY is required');
    });

    it('throws for invalid key length', () => {
      process.env.ENCRYPTION_KEY = 'ab'.repeat(16); // 16 bytes, need 32
      expect(() => encrypt('test')).toThrow('must be 32 bytes');
    });
  });

  describe('tampered ciphertext', () => {
    it('throws on flipped byte', () => {
      const encoded = encrypt('secret');
      const buf = Buffer.from(encoded, 'base64');
      buf[Math.floor(buf.length / 2)] ^= 0xff;
      expect(() => decrypt(buf.toString('base64'))).toThrow();
    });

    it('throws on truncated ciphertext', () => {
      const encoded = encrypt('secret');
      const buf = Buffer.from(encoded, 'base64');
      const short = buf.subarray(0, 10).toString('base64');
      expect(() => decrypt(short)).toThrow('too short');
    });
  });
});

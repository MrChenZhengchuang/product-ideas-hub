import crypto from 'crypto';
import { config } from '../config.js';

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function decodeBase64url(input) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4 || 4)) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
}

function signHmac(content) {
  return crypto
    .createHmac('sha256', config.jwt.secret)
    .update(content)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export function signToken(payload) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const body = {
    ...payload,
    iat: now,
    exp: now + config.jwt.expiresIn
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(body));
  const signature = signHmac(`${encodedHeader}.${encodedPayload}`);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyToken(token) {
  const parts = token.split('.');

  if (parts.length !== 3) {
    throw new Error('Invalid token');
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const expectedSignature = signHmac(`${encodedHeader}.${encodedPayload}`);

  if (signature !== expectedSignature) {
    throw new Error('Invalid token');
  }

  const payload = JSON.parse(decodeBase64url(encodedPayload));

  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired');
  }

  return payload;
}

export function hashPassword(password, salt = crypto.randomBytes(8).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password, encryptedPassword) {
  if (!encryptedPassword) {
    return false;
  }

  if (!encryptedPassword?.startsWith('scrypt$')) {
    return password === encryptedPassword;
  }

  const [, salt, storedHash] = encryptedPassword.split('$');

  if (!salt || !storedHash || !/^[\da-f]+$/i.test(storedHash) || storedHash.length % 2 !== 0) {
    return false;
  }

  const calculatedHash = crypto.scryptSync(password, salt, 64).toString('hex');
  const storedHashBuffer = Buffer.from(storedHash, 'hex');
  const calculatedHashBuffer = Buffer.from(calculatedHash, 'hex');

  if (storedHashBuffer.length !== calculatedHashBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(storedHashBuffer, calculatedHashBuffer);
}

import type { FishSpecies, UserRole } from '../src/domain/types';

export class ValidationError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = statusCode;
  }
}

export function sanitizeString(value: unknown, fieldName: string, maxLen = 250, required = true): string {
  if (typeof value !== 'string') {
    if (!required && (value === undefined || value === null)) return '';
    throw new ValidationError(`${fieldName} harus berupa teks yang valid.`);
  }
  const trimmed = value.trim();
  if (required && trimmed.length === 0) {
    throw new ValidationError(`${fieldName} tidak boleh kosong.`);
  }
  if (trimmed.length > maxLen) {
    throw new ValidationError(`${fieldName} maksimal ${maxLen} karakter.`);
  }
  return trimmed;
}

export function validatePositiveNumber(value: unknown, fieldName: string, allowZero = false): number {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) {
    throw new ValidationError(`${fieldName} harus berupa angka yang valid.`);
  }
  if (allowZero ? num < 0 : num <= 0) {
    throw new ValidationError(
      allowZero ? `${fieldName} tidak boleh kurang dari 0.` : `${fieldName} harus lebih dari 0.`
    );
  }
  return num;
}

export function validateInteger(value: unknown, fieldName: string, allowZero = false): number {
  const num = validatePositiveNumber(value, fieldName, allowZero);
  if (!Number.isInteger(num)) {
    throw new ValidationError(`${fieldName} harus berupa bilangan bulat.`);
  }
  return num;
}

export function validateIsoDate(value: unknown, fieldName: string): string {
  const str = sanitizeString(value, fieldName, 25, true);
  if (!/^\d{4}-\d{2}-\d{2}/.test(str)) {
    throw new ValidationError(`${fieldName} harus berformat tanggal YYYY-MM-DD.`);
  }
  return str.slice(0, 10);
}

export function validateSpecies(value: unknown): FishSpecies {
  const allowed: FishSpecies[] = ['Lele', 'Nila', 'Ikan emas', 'Patin'];
  if (typeof value !== 'string' || !allowed.includes(value as FishSpecies)) {
    throw new ValidationError('Jenis ikan harus salah satu dari: Lele, Nila, Ikan emas, atau Patin.');
  }
  return value as FishSpecies;
}

export function validateRole(value: unknown): UserRole {
  if (value === 'owner' || value === 'admin') return value;
  throw new ValidationError('Peran pengguna tidak valid. Pilih Owner atau Admin.', 403);
}

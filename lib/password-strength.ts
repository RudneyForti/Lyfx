/**
 * CS-33 — Strong password policy
 *
 * Pure utility — no server-only imports.
 * Usable from Server Actions and client components.
 *
 * Mandatory rules:
 *   1. Minimum of 8 characters
 *   2. At least one uppercase letter (A-Z)
 *   3. At least one lowercase letter (a-z)
 *   4. At least one number (0-9)
 *   5. At least one special character (!@#$%...)
 */

export type PasswordStrength = "weak" | "fair" | "good" | "strong";

export interface PasswordRules {
  hasLength:  boolean; // >= 8 chars
  hasUpper:   boolean; // A-Z
  hasLower:   boolean; // a-z
  hasNumber:  boolean; // 0-9
  hasSpecial: boolean; // any non-alphanumeric character
}

/** Checks each rule individually. */
export function checkPasswordRules(password: string): PasswordRules {
  return {
    hasLength:  password.length >= 8,
    hasUpper:   /[A-Z]/.test(password),
    hasLower:   /[a-z]/.test(password),
    hasNumber:  /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };
}

/**
 * Computes the password strength level.
 * Score = number of rules satisfied (0-5).
 *   0-1 → weak  · 2 → fair  · 3 → good  · 4-5 → strong
 */
export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return "weak";
  const r = checkPasswordRules(password);
  const score = [r.hasLength, r.hasUpper, r.hasLower, r.hasNumber, r.hasSpecial]
    .filter(Boolean).length;
  if (score <= 1) return "weak";
  if (score === 2) return "fair";
  if (score === 3) return "good";
  return "strong";
}

/**
 * Strict validation — returns the message of the first failing rule,
 * or null when the password satisfies every requirement.
 *
 * Use in Server Actions (setup, changePassword) and in client-side form
 * validation before submit. Messages stay in pt-BR — they are user-facing.
 */
export function validatePasswordStrict(password: string): string | null {
  const r = checkPasswordRules(password);
  if (!r.hasLength)  return "Senha deve ter ao menos 8 caracteres.";
  if (!r.hasUpper)   return "Senha deve conter ao menos uma letra maiúscula.";
  if (!r.hasLower)   return "Senha deve conter ao menos uma letra minúscula.";
  if (!r.hasNumber)  return "Senha deve conter ao menos um número.";
  if (!r.hasSpecial) return "Senha deve conter ao menos um caractere especial (!@#$%...).";
  return null;
}

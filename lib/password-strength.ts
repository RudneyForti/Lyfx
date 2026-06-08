/**
 * CS-33 — Política de senha forte
 *
 * Utilitário puro — sem imports server-only.
 * Pode ser usado em Server Actions e em componentes client.
 *
 * Regras obrigatórias:
 *   1. Mínimo 8 caracteres
 *   2. Ao menos uma letra maiúscula (A-Z)
 *   3. Ao menos uma letra minúscula (a-z)
 *   4. Ao menos um número (0-9)
 *   5. Ao menos um caractere especial (!@#$%...)
 */

export type PasswordStrength = "weak" | "fair" | "good" | "strong";

export interface PasswordRules {
  hasLength:  boolean; // >= 8 chars
  hasUpper:   boolean; // A-Z
  hasLower:   boolean; // a-z
  hasNumber:  boolean; // 0-9
  hasSpecial: boolean; // qualquer caractere não alfanumérico
}

/** Verifica cada regra individualmente. */
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
 * Calcula o nível de força da senha.
 * Score = número de regras atendidas (0-5).
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
 * Validação estrita — retorna a mensagem da primeira regra que falha,
 * ou null se a senha atende a todos os requisitos.
 *
 * Usar em Server Actions (setup, changePassword) e na validação client-side
 * do formulário antes do submit.
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

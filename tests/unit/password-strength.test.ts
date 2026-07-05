import { describe, it, expect } from "vitest";
import { checkPasswordRules, getPasswordStrength, validatePasswordStrict } from "@/lib/password-strength";

describe("checkPasswordRules", () => {
  it("flags every rule as false for an empty password", () => {
    const rules = checkPasswordRules("");
    expect(Object.values(rules).every((v) => v === false)).toBe(true);
  });

  it("passes all rules for a compliant password", () => {
    const rules = checkPasswordRules("Str0ng!Pass");
    expect(Object.values(rules).every((v) => v === true)).toBe(true);
  });

  it("detects each missing rule independently", () => {
    expect(checkPasswordRules("str0ng!pass").hasUpper).toBe(false);
    expect(checkPasswordRules("STR0NG!PASS").hasLower).toBe(false);
    expect(checkPasswordRules("Strong!Pass").hasNumber).toBe(false);
    expect(checkPasswordRules("Str0ngPass1").hasSpecial).toBe(false);
    expect(checkPasswordRules("St0!x").hasLength).toBe(false);
  });
});

describe("validatePasswordStrict", () => {
  it("returns null for a valid password", () => {
    expect(validatePasswordStrict("Str0ng!Pass")).toBeNull();
  });

  it("returns an error message for a weak password", () => {
    const error = validatePasswordStrict("abc");
    expect(typeof error).toBe("string");
    expect(error!.length).toBeGreaterThan(0);
  });
});

describe("getPasswordStrength", () => {
  it("classifies progressively stronger passwords", () => {
    expect(getPasswordStrength("abc")).toBe("weak");
    expect(getPasswordStrength("Str0ng!LongPassword")).toBe("strong");
  });
});

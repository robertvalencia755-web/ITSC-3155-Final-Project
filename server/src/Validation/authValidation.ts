// Shared rules for sign-up. Each check returns an error message, or null when the value is fine.

export const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,30}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_MIN = 8;
// scrypt cost grows with input length, so cap it to stop huge passwords tying up the server.
export const PASSWORD_MAX = 128;

export interface SignupInput {
  email: string;
  username: string;
  password: string;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// Returns the cleaned-up input, or an error message for the first problem found.
export function validateSignup(body: unknown): { value: SignupInput } | { error: string } {
  const { email, username, password } = (body ?? {}) as Record<string, unknown>;

  if (typeof email !== 'string' || typeof username !== 'string' || typeof password !== 'string') {
    return { error: 'Email, username and password are required' };
  }

  const cleanEmail = normalizeEmail(email);
  const cleanUsername = username.trim();

  if (cleanEmail.length > 255 || !EMAIL_PATTERN.test(cleanEmail)) {
    return { error: 'Enter a valid email address' };
  }
  if (!USERNAME_PATTERN.test(cleanUsername)) {
    return { error: 'Username must be 3 to 30 letters, numbers or underscores' };
  }
  if (password.length < PASSWORD_MIN) {
    return { error: `Password must be at least ${PASSWORD_MIN} characters` };
  }
  if (password.length > PASSWORD_MAX) {
    return { error: `Password must be at most ${PASSWORD_MAX} characters` };
  }

  return { value: { email: cleanEmail, username: cleanUsername, password } };
}

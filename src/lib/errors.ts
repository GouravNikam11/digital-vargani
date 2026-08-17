export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly expose: boolean;

  constructor(code: string, status = 400, message?: string) {
    super(message ?? code);
    this.code = code;
    this.status = status;
    this.expose = true;
    this.name = "AppError";
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export const ErrorCodes = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION: "VALIDATION",
  RECEIPT_LIMIT: "RECEIPT_LIMIT",
  DUPLICATE: "DUPLICATE",
  MANDAL_SUSPENDED: "MANDAL_SUSPENDED",
  ONBOARDING_REQUIRED: "ONBOARDING_REQUIRED",
} as const;

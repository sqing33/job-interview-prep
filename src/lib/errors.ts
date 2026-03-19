import OpenAI from "openai";

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function toPublicError(error: unknown) {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof OpenAI.AuthenticationError) {
    return new AppError(401, "OPENAI_AUTH_ERROR", "OpenAI API Key 无效或已过期。");
  }

  if (error instanceof OpenAI.RateLimitError) {
    return new AppError(429, "OPENAI_RATE_LIMIT", "OpenAI 请求过于频繁，请稍后重试。");
  }

  if (error instanceof OpenAI.APIError) {
    return new AppError(error.status ?? 502, "OPENAI_API_ERROR", error.message || "OpenAI 请求失败。");
  }

  if (error instanceof Error) {
    return new AppError(500, "INTERNAL_ERROR", error.message || "服务器内部错误。");
  }

  return new AppError(500, "INTERNAL_ERROR", "服务器内部错误。");
}

export function errorToResponse(error: unknown) {
  const publicError = toPublicError(error);

  return Response.json(
    {
      error: {
        code: publicError.code,
        message: publicError.message,
      },
    },
    { status: publicError.statusCode },
  );
}

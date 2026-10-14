export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    Object.assign(this, { status, code, details });
  }
}
export function assert(condition, message, status = 409, code = "CONFLICT") {
  if (!condition) throw new ApiError(status, code, message);
}
export function parse(schema, input) {
  const result = schema.safeParse(input);
  if (!result.success)
    throw new ApiError(
      422,
      "VALIDATION_ERROR",
      "Dữ liệu không hợp lệ.",
      result.error.flatten(),
    );
  return result.data;
}

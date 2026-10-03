import type { Prisma } from "@prisma/client";

export function toInputJsonValue(value: unknown): Prisma.InputJsonValue | null {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (Array.isArray(value)) {
    return value.map((item) => toInputJsonValue(item));
  }
  if (typeof value === "object") {
    const result: Record<string, Prisma.InputJsonValue | null> = {};
    for (const [key, item] of Object.entries(value)) {
      result[key] = toInputJsonValue(item);
    }
    return result;
  }
  throw new Error("Value is not JSON serializable.");
}

export function toInputJsonArray(value: unknown[]): Prisma.InputJsonArray {
  const result = toInputJsonValue(value);
  if (!Array.isArray(result)) throw new Error("Expected a JSON array.");
  return result;
}

export function toInputJsonObject(
  value: Record<string, unknown>,
): Prisma.InputJsonObject {
  const result: Record<string, Prisma.InputJsonValue | null> = {};
  for (const [key, item] of Object.entries(value)) {
    result[key] = toInputJsonValue(item);
  }
  return result;
}

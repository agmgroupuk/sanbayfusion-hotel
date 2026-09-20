import { describe, expect, it } from "vitest";
import { isClosedDate, toDateKey } from "./config";

describe("isClosedDate", () => {
  it("treats Sunday as closed", () => {
    expect(isClosedDate(new Date(2026, 6, 5))).toBe(true);
  });

  it("treats Monday as closed", () => {
    expect(isClosedDate(new Date(2026, 6, 6))).toBe(true);
  });

  it("treats Saturday as open", () => {
    expect(isClosedDate(new Date(2026, 6, 4))).toBe(false);
  });

  it("treats Tuesday as open", () => {
    expect(isClosedDate(new Date(2026, 6, 7))).toBe(false);
  });
});

describe("toDateKey", () => {
  it("formats as YYYY-MM-DD without timezone drift", () => {
    expect(toDateKey(new Date(2026, 6, 4))).toBe("2026-07-04");
  });

  it("pads single-digit months and days", () => {
    expect(toDateKey(new Date(2026, 0, 1))).toBe("2026-01-01");
  });
});

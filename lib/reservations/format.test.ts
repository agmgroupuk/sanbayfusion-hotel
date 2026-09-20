import { describe, expect, it } from "vitest";
import { formatDateLong } from "./format";

describe("formatDateLong", () => {
  it("formats a date key as a long local date", () => {
    expect(formatDateLong("2026-07-04")).toBe("Saturday 4 July 2026");
  });

  it("does not pad the day of month", () => {
    expect(formatDateLong("2026-01-01")).toBe("Thursday 1 January 2026");
  });

  it("handles the end of the year correctly", () => {
    expect(formatDateLong("2026-12-25")).toBe("Friday 25 December 2026");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
const { queue } = vi.hoisted(() => ({ queue: vi.fn() }));
vi.mock("@/lib/email/outbox", () => ({ queueContact: queue }));
import { eventBriefSchema, formatEventBrief, diningOptions, beverageOptions, entertainmentOptions } from "./events";
import { requestEventProposal } from "@/app/(site)/events/actions";
const valid = { eventType: "Private dinner", guests: 8, date: "2099-06-01", startTime: "18:30", duration: "4 hours", locationType: "Villa", location: "A villa in Bangkok", food: ["Thai cuisine"], dietary: "Vegetarian guest", beverages: ["Water"], entertainment: ["Music"], entertainmentNotes: "Quiet background music", specialRequests: "Arriving a week before the occasion", name: "Event Guest", email: "guest@example.invalid", phone: "+441234567890", preferredContact: "Email" };
beforeEach(() => { queue.mockReset(); queue.mockResolvedValue({ sent: true, queued: true }); });
describe("event enquiry contract", () => {
  it("accepts proposals with only the refreshments currently offered", () => {
    expect(eventBriefSchema.safeParse(valid).success).toBe(true);
    expect(beverageOptions).toEqual(["Water", "Soft drinks", "Coffee & tea", "Fresh juices"]);
  });
  it.each([{ guests: 0 }, { guests: 501 }, { guests: 8.5 }, { date: "2020-01-01" }, { date: "2099-02-30" }, { startTime: "25:30" }, { locationType: "unknown" }, { email: "bad" }, { preferredContact: "unknown" }, { alcoholDiscussion: "I would like to discuss requirements" }, { specialRequests: "x".repeat(2001) }])("rejects invalid brief fields: %j", patch => {
    expect(eventBriefSchema.safeParse({ ...valid, ...patch }).success).toBe(false);
  });
  it("rejects retired product requests and payment data injected into the request", async () => {
    for (const patch of [{ alcohol: { wine: "bottle" } }, { total: 1000 }, { stripePriceId: "price_fake" }, { beverages: ["Wine"] }, { beverageNotes: "Please provide wine" }, { specialRequests: "Add a bottle of whisky" }]) {
      expect((await requestEventProposal({ ...valid, ...patch })).ok).toBe(false);
    }
    expect(queue).not.toHaveBeenCalled();
  });
  it("preserves a full detailed brief beyond the general contact limit", async () => {
    const full = { ...valid, food: [...diningOptions], beverages: [...beverageOptions], entertainment: [...entertainmentOptions], dietary: "d".repeat(500), entertainmentNotes: "e".repeat(500), specialRequests: "s".repeat(2000) };
    const parsed = eventBriefSchema.parse(full);
    const message = formatEventBrief(parsed);
    expect(message.length).toBeGreaterThan(2000);
    expect(message).toContain(full.specialRequests);
    expect(message).toContain("Preferred contact: Email");
    expect(message).toContain("PRIVATE EVENT ENQUIRY");
    expect(await requestEventProposal(full)).toEqual({ ok: true });
    expect(queue).toHaveBeenCalledWith({ name: full.name, email: full.email, phone: full.phone, message });
  });
  it("does not claim success when delivery is unconfigured or fails", async () => {
    queue.mockResolvedValueOnce({ sent: false });
    expect(await requestEventProposal(valid)).toMatchObject({ ok: false });
    queue.mockRejectedValueOnce(new Error("private provider details"));
    const result = await requestEventProposal(valid);
    expect(result).toMatchObject({ ok: false });
    expect(JSON.stringify(result)).not.toContain("private provider details");
  });
});

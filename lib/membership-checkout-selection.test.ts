import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  save: vi.fn(),
  account: null as { id: string } | null,
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({ getCurrentAccount: async () => state.account }));
vi.mock("@/lib/membership-checkout", () => ({ saveMembershipCheckoutSelection: state.save }));
vi.mock("@/lib/membership-access", () => ({ membershipPlanStatus: async () => null }));

import { POST } from "@/app/api/membership/checkout-selection/route";
import { calendarMonths, serviceYears } from "@/lib/membership-service-months";

const year = serviceYears()[1];
const configuration = {
  planSlug: "3-month-membership",
  selectedServiceMonths: calendarMonths(year).slice(0, 3),
  purchaseMode: "membership_with_package",
  foodPreferences: [],
  deliveryArea: "Bangkok",
  preferredDay: "Monday",
  preferredTime: "09:00–12:00",
  selectedProducts: [{ category: "Thai soups", name: "Tom Yum Goong", quantity: 1 }],
};
function request(body: unknown) {
  return new Request("http://localhost/api/membership/checkout-selection", {
    method: "POST",
    headers: { Origin: "http://localhost", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  state.account = null;
});

describe("membership checkout selection API", () => {
  it("saves a valid food package using server pricing", async () => {
    const response = await POST(request({ planSlug: configuration.planSlug, configuration }));
    expect(response.status).toBe(200);
    expect(state.save).toHaveBeenCalledOnce();
    expect(state.save.mock.calls[0][1].purchaseMode).toBe("membership_with_package");
  });

  it.each([
    { selectedProducts: [{ category: "Beer", name: "Imported Beer", quantity: 1, price: 0 }] },
    { alcoholEnabled: true },
    { selectedAddOns: [{ category: "wine", name: "Red Wine", quantity: 1 }] },
  ])("rejects retired product fields before saving a selection", async patch => {
    const response = await POST(request({
      planSlug: configuration.planSlug,
      configuration: { ...configuration, ...patch },
    }));
    expect(response.status).toBe(400);
    expect(state.save).not.toHaveBeenCalled();
  });
});

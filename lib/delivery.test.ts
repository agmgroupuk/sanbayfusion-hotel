import { describe, expect, it } from "vitest";
import { checkDeliveryEligibility, isBangkokProvince } from "@/lib/delivery";

describe("Bangkok delivery area", () => {
  it.each(["Bangkok", "Bangkok Metropolis", "Krung Thep Maha Nakhon", "กรุงเทพมหานคร", "กรุงเทพ"])("allows the whole Bangkok province when named %s", (province) => {
    const result = checkDeliveryEligibility({
      placeId: "test-bangkok",
      formattedAddress: "A Bangkok address",
      province,
      district: "Chatuchak",
      subdistrict: "Chom Phon",
    });
    expect(result).toMatchObject({ status: "available", zone: "Bangkok delivery area", reasonCode: "COVERED" });
    expect(isBangkokProvince(province)).toBe(true);
  });

  it("rejects addresses outside Bangkok with a clear delivery-unavailable result", () => {
    const result = checkDeliveryEligibility({
      placeId: "test-outside-bangkok",
      formattedAddress: "An address in Chiang Mai",
      province: "Chiang Mai",
      district: "Mueang Chiang Mai",
      subdistrict: "Si Phum",
    });
    expect(result).toMatchObject({ status: "unavailable", reasonCode: "OUTSIDE_COVERAGE" });
    expect(result.title).toContain("outside Bangkok");
  });
});
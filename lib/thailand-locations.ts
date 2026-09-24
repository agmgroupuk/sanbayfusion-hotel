export type ThailandLocation = {
  province: string;
  districts: Array<{ name: string; subdistricts: Array<{ name: string; postalCodes: string[] }> }>;
};

// Seed data for the initial urban fallback. Replace this structured module
// with the maintained Thailand administrative import before launch.
export const thailandLocations: ThailandLocation[] = [
  {
    province: "Bangkok",
    districts: [
      { name: "Khlong Toei", subdistricts: [{ name: "Khlong Tan", postalCodes: ["10110"] }, { name: "Khlong Toei", postalCodes: ["10110"] }, { name: "Phra Khanong", postalCodes: ["10110"] }] },
      { name: "Watthana", subdistricts: [{ name: "Khlong Tan Nuea", postalCodes: ["10110"] }, { name: "Phra Khanong Nuea", postalCodes: ["10110"] }, { name: "Thawi Watthana", postalCodes: ["10110"] }] },
      { name: "Pathum Wan", subdistricts: [{ name: "Lumphini", postalCodes: ["10330"] }, { name: "Pathum Wan", postalCodes: ["10330"] }, { name: "Rong Mueang", postalCodes: ["10330"] }] },
      { name: "Sathon", subdistricts: [{ name: "Thung Maha Mek", postalCodes: ["10120"] }, { name: "Yan Nawa", postalCodes: ["10120"] }, { name: "Thung Wat Don", postalCodes: ["10120"] }] },
      { name: "Bang Rak", subdistricts: [{ name: "Si Phraya", postalCodes: ["10500"] }, { name: "Suriyawong", postalCodes: ["10500"] }, { name: "Si Lom", postalCodes: ["10500"] }] },
    ],
  },
];

export const provinces = thailandLocations.map((location) => location.province);

export function districtsForProvince(province: string) {
  return thailandLocations.find((location) => location.province === province)?.districts ?? [];
}

export function subdistrictsForDistrict(province: string, district: string) {
  return districtsForProvince(province).find((item) => item.name === district)?.subdistricts ?? [];
}
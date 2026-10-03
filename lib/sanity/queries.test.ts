import { describe, expect, it } from "vitest";
import { sanitizeMenu } from "./queries";

describe("CMS menu sanitization", () => {
  it("keeps only current catalogue items and safe current copy", () => {
    const result = sanitizeMenu({
      title: "Food and wine menu",
      intro: "Wine selections alongside dinner.",
      priceNote: "Wine from 1000 THB",
      sections: [
        { name: "Wine pairings", items: [{ name: "House Red Wine" }] },
        { name: "Thai noodles", items: [
          { name: "Pad Thai Chicken" },
          { name: "Chardonnay" },
          { name: "Pad Thai Chicken", description: "Served with wine" },
        ] },
      ],
    });
    expect(result.title).not.toMatch(/wine/i);
    expect(result.intro).not.toMatch(/wine/i);
    expect(result.priceNote).not.toMatch(/wine/i);
    expect(result.sections).toEqual([{ name: "Thai noodles", items: [{ name: "Pad Thai Chicken" }] }]);
  });

  it("uses the current catalogue when CMS content contains no active menu items", () => {
    const result = sanitizeMenu({
      title: "Old menu",
      sections: [{ name: "Old section", items: [{ name: "Unlisted product" }] }],
    });
    expect(result.sections.length).toBeGreaterThan(0);
    expect(result.sections.flatMap(section => section.items).every(item => item.name !== "Unlisted product")).toBe(true);
  });
});

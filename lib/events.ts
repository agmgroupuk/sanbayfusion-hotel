import { z } from "zod";
import { isDiscontinuedProduct } from "@/lib/discontinued-products";

export const eventTypes = ["Private dinner", "Birthday celebration", "Anniversary", "Engagement", "Family gathering", "Villa & residence event", "Corporate gathering", "Business dinner", "Holiday celebration", "Bespoke private occasion"] as const;
export const eventLocations = ["Home", "Villa", "Residence", "Office", "Private venue", "Other location"] as const;
export const diningOptions = ["Thai cuisine", "International cuisine", "Appetizers & finger food", "BBQ / grill", "Buffet", "Premium menu", "Desserts", "Snacks", "Custom catering"] as const;
export const beverageOptions = ["Water", "Soft drinks", "Coffee & tea", "Fresh juices"] as const;
export const entertainmentOptions = ["DJ", "Music", "Sound system", "Speakers", "Microphones", "Party / event setup", "Custom entertainment"] as const;
export const eventDurations = ["Up to 2 hours", "3 hours", "4 hours", "5 hours", "6+ hours", "To be discussed"] as const;
export const contactMethods = ["Email", "Phone", "WhatsApp"] as const;
export const eventStepTitles = ["Your occasion", "Location", "Dining & catering", "Beverages", "Entertainment & production", "Additional requirements", "Contact details"] as const;
export function eventToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
export const eventBriefSchema = z.object({
  eventType: z.enum(eventTypes),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose an event date").refine(value => {
    const parsed = new Date(value + "T00:00:00Z");
    return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value && value >= eventToday();
  }, "Choose a valid date today or later in Thailand"),
  startTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "Choose a start time"),
  duration: z.enum(eventDurations),
  guests: z.number().int().min(1).max(500),
  locationType: z.enum(eventLocations),
  location: z.string().trim().min(3, "Tell us the venue or area in Thailand").max(250),
  food: z.array(z.enum(diningOptions)).max(diningOptions.length),
  dietary: z.string().trim().max(500),
  beverages: z.array(z.enum(beverageOptions)).max(beverageOptions.length),
  entertainment: z.array(z.enum(entertainmentOptions)).max(entertainmentOptions.length),
  entertainmentNotes: z.string().trim().max(500),
  specialRequests: z.string().trim().max(2000),
  name: z.string().trim().min(2, "Please enter your full name").max(120),
  email: z.string().trim().email("Enter a valid email address").max(200),
  phone: z.string().trim().regex(/^\+?[0-9][0-9\s().-]{5,38}$/, "Enter your phone number with country code"),
  preferredContact: z.enum(contactMethods),
}).strict().superRefine((brief, context) => {
  if (isDiscontinuedProduct(undefined, brief.specialRequests)) {
    context.addIssue({
      code: "custom",
      path: ["specialRequests"],
      message: "Please keep this enquiry to the services offered on the website. Contact the team directly for other requirements.",
    });
  }
});
export type EventBrief = z.infer<typeof eventBriefSchema>;
export type EventDraft = Omit<EventBrief, "guests" | "eventType" | "duration" | "locationType" | "preferredContact"> & {
  guests: string; eventType: string; duration: string; locationType: string; preferredContact: string;
};
export const emptyEventBrief: EventDraft = { eventType: "", guests: "", date: "", startTime: "", duration: "", locationType: "", location: "", food: [], dietary: "", beverages: [], entertainment: [], entertainmentNotes: "", specialRequests: "", name: "", email: "", phone: "", preferredContact: "" };
export function formatEventBrief(brief: EventBrief) {
  return ["PRIVATE EVENT ENQUIRY", "Request for a tailored proposal. Not a confirmed booking, quotation or payment authorization.",
    `Event: ${brief.eventType}`, `Guests: ${brief.guests}`, `Date/time: ${brief.date} at ${brief.startTime} (Thailand / Bangkok time)`, `Duration: ${brief.duration}`,
    `Location: ${brief.locationType} — ${brief.location}`, `Dining: ${brief.food.join(", ") || "To be discussed"}`, `Dietary requirements: ${brief.dietary || "Not supplied"}`,
    `Beverages: ${brief.beverages.join(", ") || "To be discussed"}`,
    `Entertainment: ${brief.entertainment.join(", ") || "To be discussed"}`, `Production notes: ${brief.entertainmentNotes || "Not supplied"}`,
    `Additional requirements / travel dates: ${brief.specialRequests || "Not supplied"}`, `Preferred contact: ${brief.preferredContact}`,
  ].join("\n");
}

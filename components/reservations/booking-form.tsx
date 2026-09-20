"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  reservationSchema,
  type ReservationInput,
} from "@/lib/validations/reservation";
import { reservationConfig, toDateKey } from "@/lib/reservations/config";
import { formatDateLong } from "@/lib/reservations/format";
import {
  createReservationAction,
  getSlotsAction,
} from "@/app/(site)/reservations/actions";

const partyOptions = Array.from(
  { length: reservationConfig.maxPartySize - reservationConfig.minPartySize + 1 },
  (_, i) => reservationConfig.minPartySize + i,
);

function bookingBounds() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const min = new Date(today);
  min.setDate(min.getDate() + reservationConfig.leadDays);
  const max = new Date(today);
  max.setDate(max.getDate() + reservationConfig.windowDays);
  return { min, max };
}

/** Local parse of YYYY-MM-DD (avoids UTC drift from new Date(str)). */
function parseDateKey(key: string): Date | undefined {
  if (!key) return undefined;
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function BookingForm() {
  const { min, max } = bookingBounds();
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, startSlots] = useTransition();
  const [submitting, startSubmit] = useTransition();
  const [confirmation, setConfirmation] = useState<{
    message: string;
    reference?: string;
    demo?: boolean;
  } | null>(null);

  const form = useForm<ReservationInput>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      partySize: 2,
      date: "",
      timeSlot: "",
      specialRequests: "",
    },
  });

  const dateValue = form.watch("date");
  const partySize = form.watch("partySize");

  useEffect(() => {
    if (!dateValue || !partySize) {
      setSlots([]);
      return;
    }
    startSlots(async () => {
      const next = await getSlotsAction(dateValue, Number(partySize));
      setSlots(next);
      if (
        form.getValues("timeSlot") &&
        !next.includes(form.getValues("timeSlot"))
      ) {
        form.setValue("timeSlot", "", { shouldValidate: false });
      }
    });
  }, [dateValue, partySize, form]);

  function onSubmit(values: ReservationInput) {
    startSubmit(async () => {
      const result = await createReservationAction(values);
      if (result.ok) {
        setConfirmation({
          message: result.message,
          reference: result.reference,
          demo: result.demo,
        });
        form.reset();
        setSlots([]);
      } else {
        toast.error(result.error);
      }
    });
  }

  if (confirmation) {
    return (
      <div className="rounded-sm border border-gold/40 bg-card/50 p-8 text-center sm:p-12">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-gold/50 text-gold">
          <Check className="size-5" />
        </div>
        <h2 className="mt-6 font-display text-h3 font-light">Reservation requested</h2>
        <p className="lead mx-auto mt-4 max-w-md text-base">{confirmation.message}</p>
        {confirmation.reference && (
          <p className="text-eyebrow mt-6 text-muted-foreground">
            Reference · {confirmation.reference}
          </p>
        )}
        {confirmation.demo && (
          <p className="mx-auto mt-6 max-w-md text-sm text-muted-foreground">
            Demo mode — this booking was not saved. Configure the database to
            take live reservations.
          </p>
        )}
        <Button
          variant="outline"
          className="mt-8 rounded-full"
          onClick={() => setConfirmation(null)}
        >
          Make another reservation
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Party size */}
        <FormField
          control={form.control}
          name="partySize"
          render={({ field }) => (
            <FormItem className="sm:max-w-[14rem]">
              <FormLabel className="text-eyebrow text-muted-foreground">Guests</FormLabel>
              <FormControl>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 sm:text-sm"
                  value={String(field.value)}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                >
                  {partyOptions.map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? "guest" : "guests"}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Date — inline calendar */}
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-eyebrow text-muted-foreground">Date</FormLabel>
              <div className="flex justify-center rounded-md border border-input p-2">
                <Calendar
                  mode="single"
                  selected={parseDateKey(field.value)}
                  onSelect={(d) => field.onChange(d ? toDateKey(d) : "")}
                  defaultMonth={min}
                  startMonth={min}
                  endMonth={max}
                  disabled={[
                    { before: min },
                    { after: max },
                    { dayOfWeek: [...reservationConfig.closedWeekdays] },
                  ]}
                  className="bg-transparent [--cell-size:--spacing(10)] sm:[--cell-size:--spacing(9)]"
                />
              </div>
              {field.value && (
                <p className="text-sm text-muted-foreground">
                  Selected · {formatDateLong(field.value)}
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Time slots */}
        <FormField
          control={form.control}
          name="timeSlot"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-eyebrow text-muted-foreground">Time</FormLabel>
              <FormControl>
                <div className="min-h-[3rem]">
                  {!dateValue ? (
                    <p className="text-sm text-muted-foreground">
                      Select a date to see available seatings.
                    </p>
                  ) : slotsLoading ? (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" /> Checking availability…
                    </p>
                  ) : slots.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No seatings available for this date and party size. Please try another date.
                    </p>
                  ) : (
                    <div
                      role="radiogroup"
                      aria-label="Available seating times"
                      className="flex flex-wrap gap-2"
                    >
                      {slots.map((slot, i) => {
                        const selected = field.value === slot;
                        // Roving tabindex: only the selected slot (or the first,
                        // when none is chosen) is in the tab order; arrows move
                        // between slots like a native radio group.
                        const tabbable = selected || (!field.value && i === 0);
                        return (
                          <button
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            tabIndex={tabbable ? 0 : -1}
                            key={slot}
                            onClick={() => field.onChange(slot)}
                            onKeyDown={(e) => {
                              if (
                                e.key !== "ArrowRight" &&
                                e.key !== "ArrowLeft" &&
                                e.key !== "ArrowDown" &&
                                e.key !== "ArrowUp"
                              ) {
                                return;
                              }
                              e.preventDefault();
                              const dir =
                                e.key === "ArrowRight" || e.key === "ArrowDown"
                                  ? 1
                                  : -1;
                              const next =
                                (i + dir + slots.length) % slots.length;
                              field.onChange(slots[next]);
                              const group = e.currentTarget.parentElement;
                              const buttons =
                                group?.querySelectorAll<HTMLButtonElement>(
                                  '[role="radio"]',
                                );
                              buttons?.[next]?.focus();
                            }}
                            className={cn(
                              "rounded-full border px-5 py-2 text-sm transition-colors",
                              selected
                                ? "border-gold bg-gold text-gold-foreground"
                                : "border-border text-foreground/80 hover:border-foreground/50",
                            )}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-eyebrow text-muted-foreground">Name</FormLabel>
                <FormControl>
                  <Input placeholder="Full name" autoComplete="name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-eyebrow text-muted-foreground">Phone</FormLabel>
                <FormControl>
                  <Input placeholder="Contact number" autoComplete="tel" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-eyebrow text-muted-foreground">Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="specialRequests"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-eyebrow text-muted-foreground">
                Dietary needs & requests (optional)
              </FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Allergies, celebrations, accessibility…"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={submitting}
          className="h-auto w-full rounded-full bg-gold py-4 text-eyebrow text-gold-foreground hover:bg-gold/90"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" /> Requesting…
            </>
          ) : (
            "Request Reservation"
          )}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          We&apos;ll confirm your table by email or phone. Reservations are held for the full tasting menu.
        </p>
      </form>
    </Form>
  );
}

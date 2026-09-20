"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
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
import { contactSchema, type ContactInput } from "@/lib/validations/contact";
import { sendContactMessageAction } from "@/app/(site)/contact/actions";

export function ContactForm() {
  const [submitting, startSubmit] = useTransition();
  const [confirmation, setConfirmation] = useState<{
    message: string;
    demo?: boolean;
  } | null>(null);

  const form = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", phone: "", message: "" },
  });

  function onSubmit(values: ContactInput) {
    startSubmit(async () => {
      const result = await sendContactMessageAction(values);
      if (result.ok) {
        setConfirmation({ message: result.message, demo: result.demo });
        form.reset();
      } else {
        toast.error(result.error);
      }
    });
  }

  if (confirmation) {
    return (
      <div className="rounded-sm border border-gold/40 bg-card/50 p-8 text-center sm:p-10">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-gold/50 text-gold">
          <Check className="size-5" />
        </div>
        <h2 className="mt-6 font-display text-h3 font-light">Message sent</h2>
        <p className="lead mx-auto mt-4 max-w-md text-base">
          {confirmation.message}
        </p>
        {confirmation.demo && (
          <p className="mx-auto mt-6 max-w-md text-sm text-muted-foreground">
            Demo mode — this message was not delivered. Configure email to
            receive enquiries.
          </p>
        )}
        <Button
          variant="outline"
          className="mt-8 rounded-full"
          onClick={() => setConfirmation(null)}
        >
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                <FormLabel className="text-eyebrow text-muted-foreground">
                  Phone (optional)
                </FormLabel>
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
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-eyebrow text-muted-foreground">Message</FormLabel>
              <FormControl>
                <Textarea
                  rows={5}
                  placeholder="Private dining, press, partnerships, or a question…"
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
          className="h-auto w-full rounded-full bg-gold py-4 text-eyebrow text-gold-foreground hover:bg-gold/90 sm:w-auto sm:px-10"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" /> Sending…
            </>
          ) : (
            "Send Message"
          )}
        </Button>
        <p className="text-xs text-muted-foreground">
          For reservations, please use the booking form — this is for general
          enquiries.
        </p>
      </form>
    </Form>
  );
}

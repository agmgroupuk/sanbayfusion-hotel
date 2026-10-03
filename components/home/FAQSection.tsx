import { homepageFaq } from "@/components/home/faq-content";

export function FAQSection() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="py-16 sm:py-20"
    >
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16 lg:px-12">
        <div className="max-w-md">
          <p className="text-eyebrow text-gold">FAQ</p>
          <h2 id="faq-heading" className="mt-4 font-display text-h2 font-light">
            A few things to know.
          </h2>
        </div>
        <div className="divide-y divide-border border-y border-border">
          {homepageFaq.map((item) => (
            <details key={item.question} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-medium marker:hidden focus-visible:outline-none focus-visible:text-gold">
                <span>{item.question}</span>
                <span
                  aria-hidden="true"
                  className="grid size-8 shrink-0 place-items-center rounded-full border border-gold/25 text-lg font-light text-gold transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="max-w-2xl pr-10 pt-4 text-sm leading-6 text-muted-foreground">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

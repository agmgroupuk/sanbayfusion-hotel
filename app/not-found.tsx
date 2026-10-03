import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[calc(100svh-10rem)] w-full max-w-7xl flex-col items-start justify-center px-5 py-20 sm:px-8 lg:px-12">
      <p className="text-eyebrow text-gold">404</p>
      <h1 className="mt-5 font-display text-h1 font-light">Page not found</h1>
      <p className="lead mt-5 max-w-xl text-foreground/75">
        This address is not part of the current platform.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex rounded-full bg-gold px-6 py-3 text-eyebrow text-gold-foreground transition-all hover:-translate-y-0.5 hover:bg-gold/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        Return home
      </Link>
    </section>
  );
}

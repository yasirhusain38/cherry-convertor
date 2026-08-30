import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Cherry Converter for product questions, press, or partnership.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <article>
      <section className="border-b border-[var(--line)]">
        <div className="container-page py-16 md:py-20">
          <p className="label">Desk</p>
          <h1 className="display mt-4 text-5xl md:text-7xl">Write to the studio.</h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-[var(--ink-soft)]">
            There is no ticket queue hiding behind a login. A human will read it.
          </p>
        </div>
      </section>
      <section className="container-page py-16 md:py-20">
        <p className="label">Email</p>
        <a href={`mailto:${SITE.email}`} className="display mt-4 block text-3xl text-brand md:text-5xl">
          {SITE.email}
        </a>
        <p className="mt-8 max-w-lg text-sm leading-7 text-[var(--ink-soft)]">
          For tool bugs, include the browser name and the file type. Do not attach identity documents unless you have
          redacted them — we do not need the photo to debug a canvas issue.
        </p>
      </section>
    </article>
  );
}

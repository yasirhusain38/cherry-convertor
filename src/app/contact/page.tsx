import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Cherry Converter for product questions, press, or partnership.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <article className="container-page py-16">
      <p className="label">Desk</p>
      <h1 className="display mt-3 text-5xl">Contact</h1>
      <p className="mt-5 max-w-xl text-[var(--ink-soft)]">
        There is no ticket queue hiding behind a login. Write to the studio and a
        human will read it.
      </p>
      <div className="card mt-10 max-w-xl p-8">
        <p className="label">Email</p>
        <a href={`mailto:${SITE.email}`} className="mt-3 block text-2xl tracking-tight text-brand">
          {SITE.email}
        </a>
        <p className="mt-6 text-sm leading-6 text-[var(--ink-soft)]">
          For tool bugs, include the browser name and the file type. Do not attach
          identity documents unless you have redacted them — we do not need the
          photo to debug a canvas issue.
        </p>
      </div>
    </article>
  );
}

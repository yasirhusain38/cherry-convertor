import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Journal",
  description:
    "Guides on Indian passport photos, 50KB form uploads, HEIC conversion, and private image compression. Cherry Converter journal.",
  alternates: { canonical: "/blog" },
};

const POSTS = [
  {
    title: "Why Indian forms still ask for 20KB and 50KB photos",
    kicker: "Documents",
    href: "/tools/resize-image-to-50kb",
    lede: "A short field guide to the portals that reject anything larger — and how to stay under the cap without destroying a face.",
  },
  {
    title: "Passport vs Aadhaar vs PAN: the millimetre differences",
    kicker: "Specs",
    href: "/tools/passport-photo-maker",
    lede: "51×51, 35×45, 25×35. Same person, three frames. Use the right preset before you crop.",
  },
  {
    title: "HEIC from iPhone, JPEG for everyone else",
    kicker: "Convert",
    href: "/tools/heic-to-jpg",
    lede: "Apple’s default still breaks older Indian upload fields. Convert on-device, then compress.",
  },
];

export default function BlogPage() {
  return (
    <section className="container-page py-16">
      <p className="label">Journal</p>
      <h1 className="display mt-3 text-5xl">Notes from the studio</h1>
      <p className="mt-4 max-w-2xl text-[var(--ink-soft)]">
        Long-form explainers will live here. For now, each note points at the tool
        that already solves the problem.
      </p>
      <div className="mt-12 grid gap-4">
        {POSTS.map((post, index) => (
          <Link key={post.title} href={post.href} className="card card-hover p-8 no-underline">
            <p className="label">
              {String(index + 1).padStart(2, "0")}  /  {post.kicker}
            </p>
            <h2 className="mt-4 text-2xl tracking-tight">{post.title}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">{post.lede}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

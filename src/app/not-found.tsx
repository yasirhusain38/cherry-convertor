import Link from "next/link";

export default function NotFound() {
  return (
    <section className="container-page py-24 md:py-32">
      <p className="label">404</p>
      <h1 className="display mt-4 max-w-3xl text-5xl md:text-7xl">
        This page is not on the pad.
      </h1>
      <p className="mt-6 max-w-lg text-base leading-7 text-[var(--ink-soft)]">
        The tool may have moved. The inventory is still one hop away.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/" className="btn btn-primary">
          Home
        </Link>
        <Link href="/tools" className="btn btn-ghost">
          All tools
        </Link>
      </div>
    </section>
  );
}

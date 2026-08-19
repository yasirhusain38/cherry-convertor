import Link from "next/link";
import { getRelated } from "@/lib/tools";

export function RelatedTools({ slugs }: { slugs: string[] }) {
  const tools = getRelated(slugs);
  if (!tools.length) return null;

  return (
    <section className="border-t border-[var(--line)] bg-[#221F1F]">
      <div className="container-page py-20">
        <p className="label">Related systems</p>
        <h2 className="display mt-3 text-4xl">Continue in the suite</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool, index) => (
            <Link
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              className="card card-hover p-6 no-underline"
            >
              <p className="label">
                {String(index + 1).padStart(2, "0")}  /  {tool.category}
              </p>
              <h3 className="mt-4 text-xl tracking-tight">{tool.name}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{tool.lede}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Satellite } from "lucide-react";

export function DocPage({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="border-b border-border px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted hover:text-fg">
            <ArrowLeft className="size-4" />
            Workspace
          </Link>
          <span className="ml-auto flex items-center gap-2 font-display text-sm">
            <Satellite className="size-4 text-accent" />
            Abu Hureirah
          </span>
        </div>
      </header>
      <article className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-xs uppercase tracking-widest text-subtle">{kicker}</p>
        <h1 className="mt-2 font-display text-4xl font-medium leading-tight tracking-tight">{title}</h1>
        <div className="mt-8 space-y-4 text-sm leading-relaxed text-muted [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-medium [&_h2]:text-fg [&_li]:ms-4 [&_li]:list-disc [&_strong]:text-fg">
          {children}
        </div>
        <p className="mt-12 border-t border-border pt-4 text-xs text-subtle">
          Documentation archive. Not a targeting system. Public data only. Human review required.
        </p>
      </article>
    </div>
  );
}

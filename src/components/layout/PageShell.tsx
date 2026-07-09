/**
 * CineSync — PageShell
 *
 * Minimal, consistent wrapper for placeholder pages: centers the page title
 * and provides a content slot. Kept intentionally plain in this foundation
 * phase (no visual design beyond basic structure).
 */

export function PageShell({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {children}
    </div>
  );
}

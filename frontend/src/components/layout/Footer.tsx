export function Footer() {
  return (
    <footer className="border-t bg-background py-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div>© {new Date().getFullYear()} PayGuard AI · Built for audit firms partnering with the public sector.</div>
        <div className="flex items-center gap-4">
          <span>Prevention over Detection</span>
          <span aria-hidden>·</span>
          <span>Squad-locked disbursement</span>
        </div>
      </div>
    </footer>
  );
}

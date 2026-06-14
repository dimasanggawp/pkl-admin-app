function Footer() {
  return (
    <footer className="flex flex-col items-center justify-between gap-1 border-t border-border bg-surface px-4 py-3 text-xs text-muted sm:flex-row sm:px-6">
      <span>&copy; {new Date().getFullYear()} PKL Admin — Sistem Manajemen Praktik Kerja Lapangan</span>
      <span className="font-mono tracking-wide text-muted/70">v1.0 · panel admin</span>
    </footer>
  );
}

export default Footer;

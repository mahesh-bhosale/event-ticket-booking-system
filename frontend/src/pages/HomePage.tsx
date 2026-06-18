// ─────────────────────────────────────────────────────────────
//  Home Page — Placeholder
// ─────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 p-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
          🎟️ Coming Soon
        </div>

        <h1 className="text-5xl font-bold tracking-tight text-foreground">
          Sort<span className="text-primary">My</span>Scene
        </h1>

        <p className="text-lg text-muted-foreground max-w-md">
          Discover and book tickets for the best events near you.
          The platform is under active development.
        </p>
      </div>

      <div className="flex gap-3 mt-4">
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-sm text-muted-foreground">API connected</span>
      </div>
    </main>
  );
}

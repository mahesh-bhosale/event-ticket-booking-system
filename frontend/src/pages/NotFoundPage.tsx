import { Link } from 'react-router-dom';

// ─────────────────────────────────────────────────────────────
//  404 Not Found Page
// ─────────────────────────────────────────────────────────────
export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 p-8">
      <div className="text-center space-y-4">
        <p className="text-8xl font-bold text-primary/20">404</p>
        <h1 className="text-3xl font-bold text-foreground">Page Not Found</h1>
        <p className="text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
        >
          ← Back to Home
        </Link>
      </div>
    </main>
  );
}

import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { FileText, Zap, BarChart2, Trophy, Sliders } from 'lucide-react';

const nav = [
  { to: '/', label: 'Dashboard', icon: BarChart2, exact: true },
  { to: '/scripts', label: 'Scripts', icon: FileText, exact: false },
  { to: '/generate', label: 'Auto Generate', icon: Zap, exact: true },
  { to: '/generate/custom', label: 'Custom Builder', icon: Sliders, exact: true },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur">
        <div className="container flex items-center h-16 gap-6">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <Trophy className="h-6 w-6 text-primary" />
            <span>
              <span className="text-primary">WC2026</span>
              <span className="text-foreground/70 font-normal ml-1 text-sm">Script Generator</span>
            </span>
          </Link>
          <nav className="flex items-center gap-1 ml-4">
            {nav.map(({ to, label, icon: Icon, exact }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  (exact ? pathname === to : pathname.startsWith(to))
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1 container py-8">{children}</main>
      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        World Cup 2026 — News Script Generator &bull; Powered by Claude AI
      </footer>
    </div>
  );
}

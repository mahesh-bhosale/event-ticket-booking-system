import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { LogOut, Ticket, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-border/30 bg-black/40 backdrop-blur-lg supports-[backdrop-filter]:bg-black/20">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight transition-all duration-300 hover:opacity-90">
          <span className="p-2.5 rounded-xl bg-brand-gradient text-primary-foreground shadow-brand-glow-sm transition-transform duration-300 hover:scale-105">
            <Ticket className="h-4.5 w-4.5" />
          </span>
          <span className="text-white">
            Sort<span className="text-brand-gradient font-extrabold tracking-wide">My</span>Scene
          </span>
        </Link>

        {user && (
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-3 border-r border-border/30 pr-6">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="mr-2 text-muted-foreground hover:text-white hover:bg-secondary/40 font-semibold rounded-lg"
              >
                <Link to="/bookings/history">Booking History</Link>
              </Button>
              {user.role === 'ADMIN' && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="mr-2 text-primary border-primary/30 hover:bg-primary/10"
                >
                  <Link to="/admin/events">Manage Events</Link>
                </Button>
              )}
              <div className="p-2 rounded-xl bg-secondary/80 text-foreground border border-border/40">
                <UserIcon className="h-4 w-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-sm font-semibold leading-none text-white">{user.name}</span>
                <span className="text-xs leading-none text-muted-foreground mt-1.5">{user.email}</span>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-muted-foreground hover:text-primary hover:bg-primary/10 gap-2 font-semibold rounded-lg transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden xs:inline">Logout</span>
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;

import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { LogOut, Ticket, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight transition-opacity hover:opacity-90">
          <span className="p-2 rounded-lg bg-primary text-primary-foreground">
            <Ticket className="h-5 w-5" />
          </span>
          <span>
            Sort<span className="text-primary font-extrabold">My</span>Scene
          </span>
        </Link>

        {user && (
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-3 border-r pr-6 border-border">
              <div className="p-2 rounded-full bg-accent text-accent-foreground">
                <UserIcon className="h-4 w-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-sm font-semibold leading-none text-foreground">{user.name}</span>
                <span className="text-xs leading-none text-muted-foreground mt-1">{user.email}</span>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-2 font-medium"
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

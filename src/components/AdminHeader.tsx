import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Shield, BarChart3, Smartphone } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const AdminHeader = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  return (
    <header className="bg-background border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-lg font-semibold">Admin Dashboard</h1>
          </div>
          
          <nav className="flex items-center space-x-2">
            <Button
              asChild
              variant={location.pathname === '/analytics/paraiso-cambury' ? 'default' : 'ghost'}
              size="sm"
            >
              <Link to="/analytics/paraiso-cambury">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </Link>
            </Button>
            <Button
              asChild
              variant={location.pathname === '/analytics/granular' ? 'default' : 'ghost'}
              size="sm"
            >
              <Link to="/analytics/granular">
                <BarChart3 className="w-4 h-4 mr-2" />
                Granular
              </Link>
            </Button>
            <Button
              asChild
              variant={location.pathname === '/mfa-setup' ? 'default' : 'ghost'}
              size="sm"
            >
              <Link to="/mfa-setup">
                <Smartphone className="w-4 h-4 mr-2" />
                2FA
              </Link>
            </Button>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">
            {user?.email}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="text-destructive hover:text-destructive"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import {
  Home, Car, Clock, Users, BarChart2, MapPin,
  LogOut, Menu, X, Wifi, WifiOff, Settings, ChevronRight,
  Navigation, Shield
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

const navConfig = {
  PASSENGER: [
    { to: '/passenger',        icon: Home,       label: 'Book a Ride'  },
    { to: '/passenger/rides',  icon: Clock,      label: 'My Rides'     },
  ],
  DRIVER: [
    { to: '/driver',            icon: Home,       label: 'Dashboard'    },
    { to: '/driver/requests',   icon: Navigation, label: 'Ride Requests'},
    { to: '/driver/history',    icon: Clock,      label: 'History'      },
  ],
  ADMIN: [
    { to: '/admin',             icon: BarChart2,  label: 'Analytics'    },
    { to: '/admin/users',       icon: Users,      label: 'Users'        },
    { to: '/admin/drivers',     icon: Car,        label: 'Drivers'      },
    { to: '/admin/rides',       icon: MapPin,     label: 'All Rides'    },
  ],
};

const roleColors = {
  PASSENGER: 'text-brand-400',
  DRIVER:    'text-blue-400',
  ADMIN:     'text-purple-400',
};

const roleBadge = {
  PASSENGER: 'bg-brand-500/20 text-brand-400',
  DRIVER:    'bg-blue-500/20 text-blue-400',
  ADMIN:     'bg-purple-500/20 text-purple-400',
};

export default function Layout() {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const navItems = navConfig[user?.role] || [];

  const Sidebar = ({ mobile = false }) => (
    <div className={`flex flex-col h-full ${mobile ? '' : 'w-64'}`}>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center">
            <Car className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-lg leading-tight">CampusRide</h1>
            <p className="text-xs text-slate-500">IIT Roorkee</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-border">
        <div className="bg-card rounded-lg p-3">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold
              ${user?.role === 'ADMIN' ? 'bg-purple-600' : user?.role === 'DRIVER' ? 'bg-blue-600' : 'bg-brand-600'}`}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${roleBadge[user?.role]}`}>
                {user?.role}
              </span>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            {isConnected
              ? <><Wifi className="w-3 h-3 text-brand-400" /><span className="text-xs text-brand-400">Connected</span></>
              : <><WifiOff className="w-3 h-3 text-red-400" /><span className="text-xs text-red-400">Connecting...</span></>
            }
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to.split('/').length === 2}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
              ${isActive
                ? 'bg-brand-600/20 text-brand-400 border border-brand-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{label}</span>
                {isActive && <ChevronRight className="w-3 h-3 ml-auto" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium 
                     text-slate-400 hover:text-red-400 hover:bg-red-500/10 w-full transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-panel border-r border-border">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-72 bg-panel border-r border-border z-10">
            <button
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <Sidebar mobile />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-panel border-b border-border">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-400 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-brand-400" />
            <span className="font-bold text-white">CampusRide</span>
          </div>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-brand-400' : 'bg-red-400'}`} />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Receipt,
  RefreshCw,
  Package,
  BarChart3,
  Settings,
  LogOut,
  ShieldCheck,
  UserCheck,
  FileText,
  Headphones,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getSupabaseConfig } from '../../lib/supabase';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { user, role, isAdmin, signOut, switchRole } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/clients', label: 'Clients', icon: Users },
    { to: '/subscriptions', label: 'Licenses & Renewals', icon: CreditCard },
    { to: '/payments', label: 'Payments & Receipts', icon: Receipt },
    { to: '/proposals', label: 'Quotations', icon: FileText },
    { to: '/tickets', label: 'Support Tickets', icon: Headphones },
    { to: '/products', label: 'Products & Plans', icon: Package },
    { to: '/reports', label: 'Reports & Analytics', icon: BarChart3 },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <aside
      id="app-sidebar"
      className="w-64 h-full bg-white text-[#171A21] flex flex-col border-r border-[#E7E9EE] select-none shrink-0"
    >
      {/* Brand Header */}
      <div className="p-5 border-b border-[#E7E9EE]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#5B5CE2] flex items-center justify-center text-white font-bold text-base shadow-xs">
            W
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wider text-[#171A21] uppercase font-sans">
              WEBRAJYA
            </h1>
            <p className="text-[11px] text-[#687080] font-medium tracking-tight">
              Subscription Manager
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              id={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors duration-150 ${
                  isActive
                    ? 'text-[#5B5CE2] bg-[#EEF0FF]'
                    : 'text-[#687080] hover:text-[#171A21] hover:bg-[#F7F8FA]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#5B5CE2]' : 'text-[#8D95A5]'}`} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-[#E7E9EE] bg-[#F7F8FA] space-y-2.5">
        {/* Role Badge */}
        <div className="px-3 py-2 rounded-xl bg-white border border-[#E7E9EE] text-[11px] flex items-center justify-between">
          <span className="text-[#687080] flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-[#18A86B]" />
            Control Center: <strong className="text-[#171A21] uppercase font-bold">ADMIN</strong>
          </span>
        </div>

        {/* User Card */}
        <div className="flex items-center justify-between px-2 pt-0.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#5B5CE2] text-white font-bold flex items-center justify-center text-xs shrink-0">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#171A21] truncate">
                {user?.full_name || 'WebRajya User'}
              </p>
              <p className="text-[11px] text-[#9AA2B1] truncate">{user?.email}</p>
            </div>
          </div>
          <button
            id="sidebar-logout-btn"
            onClick={handleLogout}
            title="Sign Out"
            className="text-[#8D95A5] hover:text-[#D94B63] p-1.5 rounded-lg hover:bg-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

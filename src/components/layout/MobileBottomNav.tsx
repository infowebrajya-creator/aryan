import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  FileText,
  Settings,
  Search,
} from 'lucide-react';

interface MobileBottomNavProps {
  onOpenSearch: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenSearch }) => {
  const items = [
    { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/clients', label: 'Clients', icon: Users },
    { to: '/subscriptions', label: 'Licenses', icon: CreditCard },
    { to: '/proposals', label: 'Quotes', icon: FileText },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="fixed bottom-4 left-3 right-3 z-30 md:hidden flex justify-center pointer-events-none pb-safe">
      <nav className="pointer-events-auto bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-full px-3.5 py-2 flex items-center justify-between gap-1 shadow-xl shadow-slate-900/10 max-w-md w-full">
        <div className="flex items-center justify-around flex-1">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `relative group flex flex-col items-center justify-center p-1 transition-all duration-200 ${
                    isActive ? 'text-[#5B5CE2]' : 'text-slate-500 hover:text-slate-800'
                  }`
                }
              >
                {({ isActive }) => (
                  <motion.div
                    whileTap={{ scale: 0.88 }}
                    whileHover={{ y: -2, scale: 1.08 }}
                    className="flex flex-col items-center"
                  >
                    {/* Control Center Icon Badge */}
                    <div
                      className={`w-9.5 h-9.5 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                        isActive
                          ? 'bg-[#EEF0FF] text-[#5B5CE2] border border-[#5B5CE2]/20 font-bold shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600 border border-slate-200/60'
                      }`}
                    >
                      <Icon className="w-4.5 h-4.5" />
                    </div>

                    {/* Active Indicator Dot */}
                    {isActive ? (
                      <motion.span
                        layoutId="controlCenterDot"
                        className="w-1.5 h-1.5 bg-[#5B5CE2] rounded-full mt-1"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full mt-1 bg-transparent" />
                    )}
                  </motion.div>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200 mx-1 shrink-0" />

        {/* Search Action */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          whileHover={{ y: -2, scale: 1.08 }}
          onClick={onOpenSearch}
          className="p-1 text-slate-500 hover:text-[#5B5CE2] flex flex-col items-center justify-center transition-all"
          title="Search"
        >
          <div className="w-9.5 h-9.5 rounded-2xl bg-slate-100 hover:bg-slate-200/70 text-slate-600 flex items-center justify-center border border-slate-200/60">
            <Search className="w-4.5 h-4.5" />
          </div>
          <span className="w-1.5 h-1.5 rounded-full mt-1 bg-transparent" />
        </motion.button>
      </nav>
    </div>
  );
};

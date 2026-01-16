import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const navItems = [
  { label: "Simulation", id: "simulation" },
  { label: "Intelligence", id: "intelligence" },
  { label: "Schedule", id: "schedule" },
  { label: "Results", id: "results" },
  { label: "Drivers", id: "driver" },
  { label: "Teams", id: "teams" },
  { label: "About", id: "about" },
];

export default function Navigation({ currentPage, onPageChange }: NavigationProps) {
  const { isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-[9999] h-14 backdrop-blur-sm bg-[#0B0E11]/90 border-b border-white/5">
      {/* Subtle Carbon Fiber Overlay */}
      <div className="absolute inset-0 carbon-fiber opacity-[0.05] pointer-events-none"></div>

      <nav className="max-w-7xl mx-auto flex items-center justify-between h-full px-8 relative z-10">
        {/* Logo */}
        <div
          className="text-white font-semibold tracking-wide cursor-pointer group flex items-center gap-2"
          onClick={() => onPageChange('home')}
        >
          <span className="text-xl italic font-black tracking-tighter uppercase transition-colors group-hover:text-[#E10600]">
            F1<span className="text-slate-400 group-hover:text-white">PREDICT</span>
          </span>
        </div>

        {/* Navigation - Desktop */}
        <ul className="hidden md:flex gap-8 text-sm font-semibold tracking-wide text-slate-200 uppercase">
          {navItems.map(item => (
            <li key={item.id}>
              <button
                onClick={() => onPageChange(item.id)}
                className={`transition-colors py-1 ${currentPage === item.id
                  ? "text-[#E10600] border-b-2 border-[#E10600]"
                  : "hover:text-white"
                  }`}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Auth / Action */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => onPageChange(isAuthenticated ? 'profile' : 'signin')}
            className={`px-5 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-200 bg-[#141821] border border-white/10 rounded-sm hover:border-[#E10600] transition-all ${isAuthenticated ? 'border-[#E10600]/40' : ''
              }`}
          >
            {isAuthenticated ? 'Profile' : 'Sign In'}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-slate-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-14 bg-[#0B0E11] z-50 flex flex-col p-8 gap-6 animate-fadeIn">
          <ul className="flex flex-col gap-6 text-sm font-bold uppercase tracking-widest text-slate-400">
            {navItems.map(item => (
              <li key={item.id}>
                <button
                  onClick={() => {
                    onPageChange(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left transition-colors ${currentPage === item.id ? "text-[#E10600]" : "hover:text-white"
                    }`}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
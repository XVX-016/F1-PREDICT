import { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const navItems = [
  { label: "Simulation", id: "simulation" },
  { label: "Intelligence", id: "intelligence" },
  { label: "Replay", id: "replay" },
  { label: "Schedule", id: "schedule" },
  { label: "Results", id: "results" },
  { label: "Drivers", id: "driver" },
  { label: "Teams", id: "teams" },
  { label: "About", id: "about" },
];

export default function Navigation({ currentPage, onPageChange }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[9998] h-14 backdrop-blur-md bg-black/20 md:bg-gradient-to-b md:from-black/80 md:to-transparent border-b border-white/5">
        <div className="absolute inset-0 carbon-fiber opacity-[0.05] pointer-events-none"></div>

        <nav className="max-w-7xl mx-auto flex items-center justify-between h-full px-8 relative z-10">
          <div
            className="text-white font-semibold tracking-wide cursor-pointer group flex items-center gap-2"
            onClick={() => onPageChange('home')}
          >
            <span className="text-xl italic font-black tracking-tighter uppercase transition-colors group-hover:text-[#E10600]">
              F1<span className="text-slate-400 group-hover:text-white">PREDICT</span>
            </span>
          </div>

          <ul className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 gap-8 text-sm font-semibold tracking-wide text-slate-200 uppercase">
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

          <button
            className="md:hidden text-slate-400 hover:text-white ml-auto p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>
      </header>

      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black z-[10001] flex flex-col p-8 animate-fadeIn overflow-y-auto">
          <div className="flex justify-between items-center mb-12">
            <span className="text-xl italic font-black tracking-tighter uppercase text-white">
              F1<span className="text-slate-400">PREDICT</span>
            </span>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-slate-400 hover:text-white p-2"
            >
              <X size={32} />
            </button>
          </div>

          <ul className="flex flex-col gap-8 text-2xl font-black uppercase italic tracking-tighter text-slate-400">
            {navItems.map(item => (
              <li key={item.id}>
                <button
                  onClick={() => {
                    onPageChange(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left transition-colors ${currentPage === item.id ? "text-[#E10600]" : "hover:text-white"}`}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
'use client';

import Link from 'next/link';
import { Bot, FlaskConical, Home, Wrench, X } from 'lucide-react';

interface HelpPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const destinations = [
  { href: '/', label: 'Home', description: 'Platform overview', Icon: Home },
  { href: '/agents', label: 'Agents', description: 'Chat and saved sessions', Icon: Bot },
  { href: '/tools', label: 'Tools', description: 'Platform utilities', Icon: Wrench },
  { href: '/labs', label: 'Labs', description: 'Experiments and prototypes', Icon: FlaskConical },
];

const HelpPanel: React.FC<HelpPanelProps> = ({ isOpen, onClose }) => (
  <aside
    aria-label="Platform navigation"
    aria-hidden={!isOpen}
    className={`absolute top-0 right-0 z-[55] flex h-full w-[85%] flex-col border-l border-gold/15 bg-[#090909]/98 shadow-[-20px_0_60px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-transform duration-300 sm:w-72 md:w-80 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
  >
    <div className="flex items-center justify-between border-b border-white/10 p-5">
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-gold">Sanbay Fusion</p>
        <h2 className="mt-1 text-sm font-semibold text-white">Platform navigation</h2>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close navigation"
        className="rounded-full p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
      >
        <X size={17} />
      </button>
    </div>
    <nav className="space-y-2 p-4">
      {destinations.map(({ href, label, description, Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={onClose}
          tabIndex={isOpen ? 0 : -1}
          className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.025] p-3 transition-colors hover:border-gold/30 hover:bg-gold/5"
        >
          <span className="flex size-10 items-center justify-center rounded-lg bg-gold/10 text-gold">
            <Icon size={18} />
          </span>
          <span>
            <span className="block text-sm font-medium text-gray-100">{label}</span>
            <span className="mt-0.5 block text-xs text-gray-500">{description}</span>
          </span>
        </Link>
      ))}
    </nav>
  </aside>
);

export default HelpPanel;

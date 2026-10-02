import React from 'react';
import { ShieldCheck, Phone, MapPin, Clock, Mail } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-zinc-900 text-zinc-400 text-sm mt-auto border-t border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand info */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span>Digital Lost & Found</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Official centralized lost, found, and recovery system for students, faculty, and campus staff.
            </p>
            <p className="text-[11px] text-zinc-500">
              Developed for campus community welfare & student project demonstration.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">Quick Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('lost-items')} className="hover:text-white transition-colors">
                  Lost Items Directory
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('found-items')} className="hover:text-white transition-colors">
                  Found Items Directory
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('matches')} className="hover:text-white transition-colors">
                  Smart Match Engine
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('report-lost')} className="hover:text-white transition-colors">
                  Submit Lost Report
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('report-found')} className="hover:text-white transition-colors">
                  Submit Found Report
                </button>
              </li>
            </ul>
          </div>

          {/* Campus Recovery Helpdesk */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">Central Recovery Desk</h4>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                <span>Security Control Room, Gate 1, Ground Floor</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-zinc-500 shrink-0" />
                <span>Mon – Sat: 08:30 AM – 06:00 PM</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-zinc-500 shrink-0" />
                <span>Campus Helpline: (011) 2345-6789</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-zinc-500 shrink-0" />
                <span>lostandfound@campus.edu</span>
              </li>
            </ul>
          </div>

          {/* Guidelines */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">Student Guidelines</h4>
            <p className="text-xs text-zinc-400 leading-relaxed mb-3">
              Always carry your student ID card when collecting verified claimed items from the Central Security Desk.
            </p>
            <div className="p-3 bg-zinc-800/80 rounded-xl border border-zinc-700/60 text-xs">
              <p className="text-zinc-300 font-semibold mb-1">Found High-Value Items?</p>
              <p className="text-zinc-400 text-[11px]">
                Please immediately deposit laptops, mobile phones, or gold jewelry with Gate 1 security.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} Digital Lost & Found • College Campus Project. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Database Connected
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

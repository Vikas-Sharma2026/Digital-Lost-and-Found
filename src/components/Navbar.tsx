import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import {
  Search,
  Bell,
  PlusCircle,
  Menu,
  X,
  Compass,
  FileText,
  ShieldCheck,
  LogOut,
  LogIn,
  UserPlus,
  Sparkles,
  Layers,
  ChevronDown
} from 'lucide-react';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string, params?: any) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const { user, logout, login } = useAuth();
  const { unreadCount } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [switchLoading, setSwitchLoading] = useState(false);

  const handleNav = (page: string, params?: any) => {
    onNavigate(page, params);
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  };

  // Quick switch for tester/evaluator convenience
  const handleQuickSwitch = async (role: 'student' | 'admin') => {
    setSwitchLoading(true);
    try {
      if (role === 'admin') {
        await login('admin@campus.edu', 'Admin@123');
        onNavigate('admin-dashboard');
      } else {
        await login('rahul.student@campus.edu', 'Student@123');
        onNavigate('student-dashboard');
      }
    } catch (err) {
      console.error('Quick switch failed:', err);
    } finally {
      setSwitchLoading(false);
      setProfileDropdownOpen(false);
    }
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => handleNav('home')}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-black text-xl shadow-xs group-hover:bg-indigo-600 transition-colors">
                <Compass className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-zinc-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                  Campus Lost & Found
                  <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.2 bg-zinc-100 text-zinc-600 rounded">
                    Portal
                  </span>
                </span>
                <span className="block text-[11px] font-medium text-zinc-500">
                  College Item Recovery System
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-1">
              <button
                onClick={() => handleNav('lost-items')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === 'lost-items'
                    ? 'bg-zinc-100 text-zinc-900 font-semibold'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                }`}
              >
                Lost Items
              </button>

              <button
                onClick={() => handleNav('found-items')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === 'found-items'
                    ? 'bg-zinc-100 text-zinc-900 font-semibold'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                }`}
              >
                Found Items
              </button>

              <button
                onClick={() => handleNav('search')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  currentPage === 'search'
                    ? 'bg-zinc-100 text-zinc-900 font-semibold'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                }`}
              >
                <Search className="w-3.5 h-3.5 text-zinc-500" />
                <span>Search</span>
              </button>

              <button
                onClick={() => handleNav('matches')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  currentPage === 'matches'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-zinc-600 hover:text-indigo-600 hover:bg-zinc-50'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Potential Matches</span>
              </button>

              {user?.role === 'admin' ? (
                <button
                  onClick={() => handleNav('admin-dashboard')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                    currentPage.startsWith('admin')
                      ? 'bg-purple-100 text-purple-900'
                      : 'text-purple-700 hover:bg-purple-50'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span>Admin Panel</span>
                </button>
              ) : user ? (
                <button
                  onClick={() => handleNav('student-dashboard')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === 'student-dashboard'
                      ? 'bg-zinc-100 text-zinc-900 font-semibold'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                  }`}
                >
                  Dashboard
                </button>
              ) : null}
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="hidden lg:flex items-center gap-2.5">
            {/* Quick Report Buttons */}
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleNav('report-lost')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Report Lost</span>
                </button>

                <button
                  onClick={() => handleNav('report-found')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Report Found</span>
                </button>

                {/* Notifications Bell */}
                <button
                  onClick={() => handleNav('notifications')}
                  className="relative p-2 rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>
            ) : null}

            {/* Quick Demo Switcher Pill */}
            <div className="flex items-center bg-zinc-100 p-0.5 rounded-xl border border-zinc-200 text-xs">
              <button
                onClick={() => handleQuickSwitch('student')}
                disabled={switchLoading}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  user?.role === 'student'
                    ? 'bg-white text-zinc-900 shadow-xs font-semibold'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
                title="Log in instantly as Student Rahul Verma"
              >
                Demo Student
              </button>
              <button
                onClick={() => handleQuickSwitch('admin')}
                disabled={switchLoading}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  user?.role === 'admin'
                    ? 'bg-purple-600 text-white shadow-xs font-semibold'
                    : 'text-purple-700 hover:text-purple-900'
                }`}
                title="Log in instantly as Admin Prof. Ramesh"
              >
                Demo Admin
              </button>
            </div>

            {/* User Profile or Auth Buttons */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-xs uppercase">
                    {user.name.charAt(0)}
                  </div>
                  <div className="hidden xl:block">
                    <p className="text-xs font-semibold text-zinc-900 truncate max-w-32">
                      {user.name}
                    </p>
                    <p className="text-[10px] text-zinc-500 capitalize">{user.role}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-zinc-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-4 py-2 border-b border-zinc-100">
                      <p className="text-xs font-semibold text-zinc-900 truncate">{user.name}</p>
                      <p className="text-[11px] text-zinc-500 truncate">{user.email}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">ID: {user.collegeId}</p>
                    </div>

                    {user.role === 'admin' ? (
                      <>
                        <button
                          onClick={() => handleNav('admin-dashboard')}
                          className="w-full px-4 py-2 text-left text-xs text-zinc-700 hover:bg-zinc-50 flex items-center gap-2"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                          <span>Admin Dashboard</span>
                        </button>
                        <button
                          onClick={() => handleNav('admin-items')}
                          className="w-full px-4 py-2 text-left text-xs text-zinc-700 hover:bg-zinc-50 flex items-center gap-2"
                        >
                          <Layers className="w-3.5 h-3.5 text-purple-600" />
                          <span>Manage Item Reports</span>
                        </button>
                        <button
                          onClick={() => handleNav('admin-claims')}
                          className="w-full px-4 py-2 text-left text-xs text-zinc-700 hover:bg-zinc-50 flex items-center gap-2"
                        >
                          <FileText className="w-3.5 h-3.5 text-purple-600" />
                          <span>Verify Claims Queue</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleNav('student-dashboard')}
                          className="w-full px-4 py-2 text-left text-xs text-zinc-700 hover:bg-zinc-50 flex items-center gap-2"
                        >
                          <Layers className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Student Dashboard</span>
                        </button>
                        <button
                          onClick={() => handleNav('my-reports')}
                          className="w-full px-4 py-2 text-left text-xs text-zinc-700 hover:bg-zinc-50 flex items-center gap-2"
                        >
                          <FileText className="w-3.5 h-3.5 text-zinc-500" />
                          <span>My Submitted Reports</span>
                        </button>
                        <button
                          onClick={() => handleNav('my-claims')}
                          className="w-full px-4 py-2 text-left text-xs text-zinc-700 hover:bg-zinc-50 flex items-center gap-2"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
                          <span>My Ownership Claims</span>
                        </button>
                      </>
                    )}

                    <div className="border-t border-zinc-100 my-1"></div>
                    <button
                      onClick={async () => {
                        await logout();
                        handleNav('home');
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleNav('login')}
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-zinc-800 hover:bg-zinc-100 transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Log In</span>
                </button>
                <button
                  onClick={() => handleNav('register')}
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 transition-colors shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Sign Up</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu hamburger button */}
          <div className="flex lg:hidden items-center gap-2">
            {user && (
              <button
                onClick={() => handleNav('notifications')}
                className="relative p-2 rounded-xl text-zinc-700 hover:bg-zinc-100"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-zinc-700 hover:bg-zinc-100 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-zinc-200 px-4 pt-3 pb-6 space-y-3">
          {/* Quick Demo Switcher on Mobile */}
          <div className="p-2.5 bg-zinc-100 rounded-xl mb-3">
            <span className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
              Quick 1-Click Role Testing:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleQuickSwitch('student')}
                className="px-3 py-2 bg-white text-zinc-900 rounded-lg text-xs font-semibold shadow-xs text-center"
              >
                Login Student
              </button>
              <button
                onClick={() => handleQuickSwitch('admin')}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg text-xs font-semibold shadow-xs text-center"
              >
                Login Admin
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleNav('report-lost')}
              className="px-3 py-2 text-center rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200"
            >
              + Report Lost
            </button>
            <button
              onClick={() => handleNav('report-found')}
              className="px-3 py-2 text-center rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200"
            >
              + Report Found
            </button>
          </div>

          <div className="space-y-1 pt-2">
            <button
              onClick={() => handleNav('lost-items')}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Lost Items
            </button>
            <button
              onClick={() => handleNav('found-items')}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Found Items
            </button>
            <button
              onClick={() => handleNav('search')}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Search & Filter
            </button>
            <button
              onClick={() => handleNav('matches')}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-indigo-700 hover:bg-indigo-50"
            >
              Potential Matches
            </button>

            {user ? (
              <>
                <div className="border-t border-zinc-100 my-2 pt-2">
                  <p className="px-3 text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    My Account ({user.role})
                  </p>
                  {user.role === 'admin' ? (
                    <>
                      <button
                        onClick={() => handleNav('admin-dashboard')}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-purple-800 hover:bg-purple-50"
                      >
                        Admin Dashboard
                      </button>
                      <button
                        onClick={() => handleNav('admin-items')}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-purple-800 hover:bg-purple-50"
                      >
                        Manage Items
                      </button>
                      <button
                        onClick={() => handleNav('admin-claims')}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-purple-800 hover:bg-purple-50"
                      >
                        Verify Claims
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleNav('student-dashboard')}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                      >
                        Student Dashboard
                      </button>
                      <button
                        onClick={() => handleNav('my-reports')}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                      >
                        My Reports
                      </button>
                      <button
                        onClick={() => handleNav('my-claims')}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                      >
                        My Claims
                      </button>
                    </>
                  )}
                  <button
                    onClick={async () => {
                      await logout();
                      handleNav('home');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50"
                  >
                    Log Out
                  </button>
                </div>
              </>
            ) : (
              <div className="pt-2 border-t border-zinc-100 flex flex-col gap-2">
                <button
                  onClick={() => handleNav('login')}
                  className="w-full py-2.5 text-center font-medium text-sm text-zinc-800 bg-zinc-100 rounded-xl"
                >
                  Log In
                </button>
                <button
                  onClick={() => handleNav('register')}
                  className="w-full py-2.5 text-center font-medium text-sm text-white bg-zinc-900 rounded-xl"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

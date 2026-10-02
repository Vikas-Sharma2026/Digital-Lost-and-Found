import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, Lock, Mail, AlertCircle, ShieldCheck, User } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (page: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide your email and password.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const user = await login(email, password);
      if (user.role === 'admin') {
        onNavigate('admin-dashboard');
      } else {
        onNavigate('student-dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemoStudent = () => {
    setEmail('rahul.student@campus.edu');
    setPassword('Student@123');
    setError(null);
  };

  const fillDemoAdmin = () => {
    setEmail('admin@campus.edu');
    setPassword('Admin@123');
    setError(null);
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-zinc-900 text-white p-6 sm:p-8 text-center">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md">
            <LogIn className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black">Welcome Back</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Access the College Lost & Found Portal
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Quick Demo Logins Box */}
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4">
            <p className="text-xs font-bold text-indigo-950 uppercase tracking-wider mb-2">
              ⚡ Quick 1-Click Credentials For Testing:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={fillDemoStudent}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-zinc-50 border border-indigo-200 rounded-xl text-xs font-semibold text-indigo-900 shadow-xs transition-colors"
              >
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span>Student Test</span>
              </button>
              <button
                type="button"
                onClick={fillDemoAdmin}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-zinc-50 border border-indigo-200 rounded-xl text-xs font-semibold text-purple-900 shadow-xs transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>Admin Test</span>
              </button>
            </div>
            <p className="text-[11px] text-indigo-700/80 mt-2 text-center">
              Student: rahul.student@campus.edu • Admin: admin@campus.edu
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs sm:text-sm text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                Campus Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@campus.edu"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 text-zinc-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 text-zinc-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-xl text-sm transition-colors shadow-xs disabled:opacity-50 mt-2"
            >
              {submitting ? 'Verifying Credentials...' : 'Log In'}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-zinc-100 text-xs text-zinc-600">
            Don't have an account yet?{' '}
            <button
              onClick={() => onNavigate('register')}
              className="text-indigo-600 font-semibold hover:underline"
            >
              Register here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

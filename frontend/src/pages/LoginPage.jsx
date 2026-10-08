import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Eye, EyeOff, Lock, Mail, ArrowRight, Shield, User, Wrench, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const loggedUser = await login(email, password);

      // Role-based redirection
      if (loggedUser.role === 'ADMIN') {
        navigate('/admin');
      } else if (loggedUser.role === 'WORKER') {
        navigate('/worker');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Demo auto-fill helpers for project demonstration and viva
  const fillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#F5F8F5] flex flex-col justify-center px-4 py-8">
      <div className="max-w-md w-full mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#2E7D32] text-white shadow-lg mb-2">
            <Trash2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            Sign In to Smart Waste
          </h2>
          <p className="text-xs text-gray-600">
            Citizen, Sanitation Worker & Administrator Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-gray-100 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2 text-xs text-red-700 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-gray-700">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-[#2E7D32] hover:underline font-medium"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-gray-400 hover:text-gray-600 absolute right-3 top-2.5 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.99] flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials Box for College Viva */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-1 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                Demo Accounts (Viva Quick Fill)
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('admin@smartwaste.gov', 'AdminPassword@123')}
                className="py-1.5 px-2 bg-purple-50 hover:bg-purple-100 text-purple-800 text-[11px] font-medium rounded-lg border border-purple-200 flex flex-col items-center justify-center transition"
              >
                <Shield className="w-3.5 h-3.5 mb-0.5 text-purple-700" />
                <span>Admin</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('ramesh.worker@smartwaste.gov', 'WorkerPassword@123')}
                className="py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-medium rounded-lg border border-amber-200 flex flex-col items-center justify-center transition"
              >
                <Wrench className="w-3.5 h-3.5 mb-0.5 text-amber-700" />
                <span>Worker</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('rahul.citizen@example.com', 'CitizenPassword@123')}
                className="py-1.5 px-2 bg-green-50 hover:bg-green-100 text-green-800 text-[11px] font-medium rounded-lg border border-green-200 flex flex-col items-center justify-center transition"
              >
                <User className="w-3.5 h-3.5 mb-0.5 text-[#2E7D32]" />
                <span>Citizen</span>
              </button>
            </div>
          </div>
        </div>

        {/* Public Registration Link */}
        <p className="text-center text-xs text-gray-600">
          Don't have a citizen account yet?{' '}
          <Link to="/register" className="text-[#2E7D32] font-semibold hover:underline">
            Register as Citizen
          </Link>
        </p>
      </div>
    </div>
  );
};

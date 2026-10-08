import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Sparkles, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SplashPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        if (isAuthenticated) {
          if (user?.role === 'ADMIN') navigate('/admin');
          else if (user?.role === 'WORKER') navigate('/worker');
          else navigate('/dashboard');
        } else {
          navigate('/login');
        }
      }, 1400);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, loading, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1B5E20] via-[#2E7D32] to-[#388E3C] flex flex-col items-center justify-between p-6 text-white text-center select-none">
      <div className="pt-8">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-medium border border-white/20">
          <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
          <span>B.Tech CSE Community Service Project (CSP)</span>
        </div>
      </div>

      <div className="flex flex-col items-center max-w-sm">
        {/* Animated App Logo */}
        <div className="relative mb-6">
          <div className="w-28 h-28 bg-white rounded-3xl shadow-2xl flex items-center justify-center transform rotate-3 transition-transform hover:rotate-0">
            <Trash2 className="w-14 h-14 text-[#2E7D32]" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-gray-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-md">
            SMART
          </div>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight mb-2 drop-shadow-sm">
          Smart Waste Collection
        </h1>
        <p className="text-green-100 font-medium text-sm tracking-wide mb-8">
          Clean City, Green Future
        </p>

        {/* Progress Bar Animation */}
        <div className="w-48 h-1.5 bg-green-900/50 rounded-full overflow-hidden shadow-inner">
          <div className="h-full bg-white rounded-full animate-pulse"></div>
        </div>
        <span className="text-[11px] text-green-200 mt-2 font-mono">Initializing System...</span>
      </div>

      <div className="pb-6 flex items-center space-x-2 text-xs text-green-200/80">
        <ShieldCheck className="w-4 h-4 text-green-300" />
        <span>Municipal & Community Waste Management</span>
      </div>
    </div>
  );
};

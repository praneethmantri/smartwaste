import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, KeyRound, Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/client';

export const ForgotPasswordPage = () => {
  const { lang, setLanguage, t } = useLanguage();
  const [step, setStep] = useState(1); // 1: request, 2: reset
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleRequest = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      setLoading(true);
      const res = await api.post('/auth/forgot-password', { email });
      setMessage(res.message || 'Reset request verified. Enter your new password below.');
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      setLoading(true);
      const res = await api.post('/auth/reset-password', { email, newPassword });
      setMessage(res.message);
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F8F5] flex flex-col justify-center px-4 py-8 relative">
      {/* Language Switcher in Top Right */}
      <div className="absolute top-4 right-4 flex items-center space-x-1">
        <div className="relative">
          <select
            value={lang}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-white text-gray-800 text-xs font-medium py-1.5 px-2.5 rounded-xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32] appearance-none cursor-pointer pr-6"
          >
            <option value="en">English</option>
            <option value="te">తెలుగు (TE)</option>
            <option value="hi">हिन्दी (HI)</option>
          </select>
          <Globe className="w-3.5 h-3.5 text-gray-400 absolute right-1.5 top-2.5 pointer-events-none" />
        </div>
      </div>

      <div className="max-w-md w-full mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500 text-white shadow-md mb-1">
            <KeyRound className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{t('resetAccountPassword')}</h2>
          <p className="text-xs text-gray-600">
            {t('recoverAccess')}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-100 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl flex items-start space-x-2 text-xs text-green-700">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
              <span>{message}</span>
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleRequest} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700">{t('email')}</label>
                <div className="relative mt-1">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-semibold text-sm rounded-xl shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <span>{loading ? t('verifying') : t('continueToReset')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700">{t('enterNewPassword')}</label>
                <div className="relative mt-1">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter min 6 characters"
                    required
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-semibold text-sm rounded-xl shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <span>{loading ? t('resetting') : t('resetPasswordBtn')}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </form>
          )}

          {step === 3 && (
            <div className="text-center py-4 space-y-4">
              <p className="text-sm text-gray-700">
                {t('resetPasswordSuccess')}
              </p>
              <Link
                to="/login"
                className="inline-flex items-center space-x-1.5 px-6 py-2.5 bg-[#2E7D32] text-white font-semibold text-sm rounded-xl shadow-md hover:bg-[#1B5E20] transition"
              >
                <span>{t('returnToLogin')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        <div className="text-center">
          <Link to="/login" className="inline-flex items-center space-x-1 text-xs text-gray-600 hover:text-green-800 font-medium">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('backToLogin')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

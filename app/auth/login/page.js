'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Phone, ArrowRight, Clock } from 'lucide-react';
import { authAPI } from '@/lib/api';
import { auth } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      alert('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      await authAPI.sendOTP(phone);
      setShowOTP(true);
      startTimer();
    } catch (error) {
      alert('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      alert('Please enter the complete 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.verifyOTP(phone, otp);
      auth.setToken(response.token);
      
      if (response.user && response.user.role) {
        auth.setRole(response.user.role);
        auth.setUser(response.user);
        
        switch (response.user.role) {
          case 'owner':
            router.push('/dashboard');
            break;
          case 'vet':
            router.push('/vet-dashboard');
            break;
          case 'clinic':
            router.push('/clinic-dashboard');
            break;
          default:
            router.push('/auth/register');
        }
      } else {
        router.push('/auth/register');
      }
    } catch (error) {
      alert('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startTimer = () => {
    setTimer(30);
    setCanResend(false);
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    
    setLoading(true);
    try {
      await authAPI.sendOTP(phone);
      startTimer();
      alert('OTP sent successfully');
    } catch (error) {
      alert('Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {showOTP ? 'Verify OTP' : 'Welcome to VetBridge'}
            </h1>
            <p className="text-gray-600">
              {showOTP
                ? `Enter the 6-digit code sent to ${phone}`
                : 'Enter your phone number to continue'}
            </p>
          </div>

          {!showOTP ? (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+254 7XX XXX XXX"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition flex items-center justify-center gap-2 disabled:bg-gray-400"
              >
                {loading ? 'Sending...' : 'Continue'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center text-2xl tracking-widest"
                  maxLength={6}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition flex items-center justify-center gap-2 disabled:bg-gray-400"
              >
                {loading ? 'Verifying...' : 'Verify'}
                <ArrowRight className="w-5 h-5" />
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={!canResend}
                  className="text-primary-600 hover:text-primary-700 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-1 mx-auto"
                >
                  <Clock className="w-4 h-4" />
                  {canResend ? 'Resend OTP' : `Resend in ${timer}s`}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-gray-600">
            By continuing, you agree to our{' '}
            <Link href="/terms" className="text-primary-600 hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-primary-600 hover:underline">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

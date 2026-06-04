'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Briefcase, Building, ArrowRight } from 'lucide-react';
import { authAPI } from '@/lib/api';
import { auth } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);

  const roles = [
    {
      id: 'owner',
      title: 'Pet Owner',
      description: 'Find vets, book appointments, track your pet\'s health',
      icon: User,
      color: 'primary',
    },
    {
      id: 'vet',
      title: 'Veterinarian',
      description: 'Accept bookings, manage appointments, earn money',
      icon: Briefcase,
      color: 'secondary',
    },
    {
      id: 'clinic',
      title: 'Clinic Owner',
      description: 'Manage your clinic, team, and analytics',
      icon: Building,
      color: 'accent',
    },
  ];

  const handleContinue = async () => {
    if (!selectedRole) {
      alert('Please select a role');
      return;
    }

    setLoading(true);
    try {
      // In a real app, you would complete registration with additional data
      await authAPI.completeRegistration({ role: selectedRole });
      auth.setRole(selectedRole);
      
      switch (selectedRole) {
        case 'owner':
          router.push('/dashboard');
          break;
        case 'vet':
          router.push('/vet-dashboard');
          break;
        case 'clinic':
          router.push('/clinic-dashboard');
          break;
      }
    } catch (error) {
      alert('Failed to complete registration');
    } finally {
      setLoading(false);
    }
  };

  const colorClasses = {
    primary: 'bg-primary-100 text-primary-600 hover:bg-primary-200',
    secondary: 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200',
    accent: 'bg-accent-100 text-accent-600 hover:bg-accent-200',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Role</h1>
          <p className="text-xl text-gray-600">Select how you want to use VetBridge</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`p-8 rounded-2xl border-2 transition-all ${
                  selectedRole === role.id
                    ? `${colorClasses[role.color].split(' ')[0]} border-current`
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  colorClasses[role.color].split(' ')[0]
                }`}>
                  <Icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{role.title}</h3>
                <p className="text-gray-600 text-sm">{role.description}</p>
              </button>
            );
          })}
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={handleContinue}
            disabled={!selectedRole || loading}
            className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Account...' : 'Continue'}
            <ArrowRight className="w-5 h-5" />
          </button>
          <Link
            href="/auth/login"
            className="bg-white text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition border border-gray-300"
          >
            Back
          </Link>
        </div>
      </div>
    </div>
  );
}

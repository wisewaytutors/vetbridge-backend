'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, Calendar, DollarSign, TrendingUp, Building2, BarChart3, Settings } from 'lucide-react';
import { auth } from '@/lib/auth';
import { clinicAPI } from '@/lib/api';

export default function ClinicDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [team, setTeam] = useState([]);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    if (!auth.isAuthenticated() || auth.getRole() !== 'clinic') {
      router.push('/auth/login');
      return;
    }

    loadDashboardData();
  }, [router]);

  const loadDashboardData = async () => {
    try {
      const response = await clinicAPI.getDashboard();
      setStats(response.stats);
      setTeam(response.team || []);
      setBookings(response.bookings || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Clinic Dashboard</h1>
          <p className="text-gray-600">Manage your clinic, team, and analytics</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-primary-600" />
              </div>
              <span className="text-gray-600">Vets</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats?.totalVets || 0}</p>
            <p className="text-sm text-gray-600">Total</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-secondary-600" />
              </div>
              <span className="text-gray-600">Today</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats?.todayBookings || 0}</p>
            <p className="text-sm text-gray-600">Bookings</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-accent-600" />
              </div>
              <span className="text-gray-600">Revenue</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats?.weekRevenue || 'KES 0'}</p>
            <p className="text-sm text-gray-600">This Week</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-yellow-600" />
              </div>
              <span className="text-gray-600">Patients</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats?.totalPatients || 0}</p>
            <p className="text-sm text-gray-600">Active</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Team Status */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Team Status</h2>
              <Link href="/clinic/team" className="text-primary-600 hover:underline text-sm">
                Manage Team
              </Link>
            </div>
            {team.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No team members yet</p>
                <Link
                  href="/clinic/team/add"
                  className="inline-block mt-2 text-primary-600 hover:underline"
                >
                  Add your first vet
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {team.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${member.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <div>
                        <p className="font-semibold text-gray-900">{member.name}</p>
                        <p className="text-sm text-gray-600">{member.specialty}</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-600">{member.bookingsToday} bookings</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Bookings */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Recent Bookings</h2>
              <Link href="/clinic/bookings" className="text-primary-600 hover:underline text-sm">
                View All
              </Link>
            </div>
            {bookings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No recent bookings</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{booking.vetName}</p>
                        <p className="text-sm text-gray-600">Pet: {booking.petName}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        booking.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{booking.date} at {booking.time}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-4">
          <Link
            href="/clinic/team"
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition"
          >
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-3">
              <Users className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Team</h3>
            <p className="text-sm text-gray-600">Manage staff</p>
          </Link>
          <Link
            href="/clinic/analytics"
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition"
          >
            <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mb-3">
              <BarChart3 className="w-6 h-6 text-secondary-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Analytics</h3>
            <p className="text-sm text-gray-600">View reports</p>
          </Link>
          <Link
            href="/clinic/schedule"
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition"
          >
            <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center mb-3">
              <Calendar className="w-6 h-6 text-accent-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Schedule</h3>
            <p className="text-sm text-gray-600">Manage hours</p>
          </Link>
          <Link
            href="/clinic/settings"
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition"
          >
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
              <Settings className="w-6 h-6 text-gray-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Settings</h3>
            <p className="text-sm text-gray-600">Clinic settings</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

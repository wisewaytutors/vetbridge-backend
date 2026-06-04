'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Users, DollarSign, Star, Clock, MapPin, CheckCircle, XCircle, Navigation } from 'lucide-react';
import { auth } from '@/lib/auth';
import { vetAPI } from '@/lib/api';

export default function VetDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    if (!auth.isAuthenticated() || auth.getRole() !== 'vet') {
      router.push('/auth/login');
      return;
    }

    loadDashboardData();
  }, [router]);

  const loadDashboardData = async () => {
    try {
      const response = await vetAPI.getDashboard();
      setStats(response.stats);
      setBookings(response.bookings || []);
      setIsAvailable(response.isAvailable !== false);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async () => {
    try {
      await vetAPI.updateAvailability(!isAvailable);
      setIsAvailable(!isAvailable);
    } catch (error) {
      alert('Failed to update availability');
    }
  };

  const handleAcceptBooking = async (bookingId) => {
    try {
      await vetAPI.acceptBooking(bookingId);
      loadDashboardData();
    } catch (error) {
      alert('Failed to accept booking');
    }
  };

  const handleRejectBooking = async (bookingId) => {
    try {
      await vetAPI.rejectBooking(bookingId);
      loadDashboardData();
    } catch (error) {
      alert('Failed to reject booking');
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vet Dashboard</h1>
            <p className="text-gray-600">Manage your appointments and patients</p>
          </div>
          <button
            onClick={handleToggleAvailability}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              isAvailable
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
          >
            {isAvailable ? 'Available' : 'Unavailable'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary-600" />
              </div>
              <span className="text-gray-600">Today</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats?.todayBookings || 0}</p>
            <p className="text-sm text-gray-600">Bookings</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-secondary-600" />
              </div>
              <span className="text-gray-600">Total</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats?.totalPatients || 0}</p>
            <p className="text-sm text-gray-600">Patients</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-accent-600" />
              </div>
              <span className="text-gray-600">This Week</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats?.weekEarnings || 'KES 0'}</p>
            <p className="text-sm text-gray-600">Earnings</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <span className="text-gray-600">Rating</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats?.rating || '0.0'}</p>
            <p className="text-sm text-gray-600">Average</p>
          </div>
        </div>

        {/* Upcoming Bookings */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Upcoming Bookings</h2>
            <Link href="/vet/bookings" className="text-primary-600 hover:underline text-sm">
              View All
            </Link>
          </div>
          {bookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No upcoming bookings</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div key={booking.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{booking.petName}</h3>
                      <p className="text-sm text-gray-600">Owner: {booking.ownerName}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {booking.date} at {booking.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {booking.address}
                    </span>
                  </div>
                  {booking.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptBooking(booking.id)}
                        className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition flex items-center justify-center gap-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectBooking(booking.id)}
                        className="flex-1 bg-red-100 text-red-700 py-2 rounded-lg hover:bg-red-200 transition flex items-center justify-center gap-1"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  )}
                  {booking.status === 'confirmed' && (
                    <button className="w-full bg-secondary-600 text-white py-2 rounded-lg hover:bg-secondary-700 transition flex items-center justify-center gap-1">
                      <Navigation className="w-4 h-4" />
                      Navigate to Location
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4">
          <Link
            href="/vet/patients"
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition"
          >
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-3">
              <Users className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">My Patients</h3>
            <p className="text-sm text-gray-600">View patient history</p>
          </Link>
          <Link
            href="/vet/prescriptions"
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition"
          >
            <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mb-3">
              <Calendar className="w-6 h-6 text-secondary-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Prescriptions</h3>
            <p className="text-sm text-gray-600">Manage prescriptions</p>
          </Link>
          <Link
            href="/vet/earnings"
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition"
          >
            <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center mb-3">
              <DollarSign className="w-6 h-6 text-accent-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Earnings</h3>
            <p className="text-sm text-gray-600">View earnings report</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

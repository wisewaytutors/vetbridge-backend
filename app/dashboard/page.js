'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, PawPrint, ShoppingBag, MessageSquare, Bell, Plus, MapPin, Clock, Star } from 'lucide-react';
import { auth } from '@/lib/auth';
import { ownerAPI } from '@/lib/api';
import StarRating from '@/components/ui/StarRating';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pets, setPets] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [nearbyVets, setNearbyVets] = useState([]);

  useEffect(() => {
    if (!auth.isAuthenticated() || auth.getRole() !== 'owner') {
      router.push('/auth/login');
      return;
    }

    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      const [petsData, bookingsData, vetsData] = await Promise.all([
        ownerAPI.getPets(),
        ownerAPI.getBookings(),
        ownerAPI.getVets({ limit: 3 }),
      ]);
      setPets(petsData.pets || []);
      setBookings(bookingsData.bookings?.slice(0, 3) || []);
      setNearbyVets(vetsData.vets || []);
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
          <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
          <p className="text-gray-600">Manage your pets and bookings</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Link
            href="/vets"
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition border border-gray-200"
          >
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-3">
              <Calendar className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Book Vet</h3>
            <p className="text-sm text-gray-600">Find & book</p>
          </Link>
          <Link
            href="/pets"
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition border border-gray-200"
          >
            <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mb-3">
              <PawPrint className="w-6 h-6 text-secondary-600" />
            </div>
            <h3 className="font-semibold text-gray-900">My Pets</h3>
            <p className="text-sm text-gray-600">{pets.length} pets</p>
          </Link>
          <Link
            href="/marketplace"
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition border border-gray-200"
          >
            <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center mb-3">
              <ShoppingBag className="w-6 h-6 text-accent-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Marketplace</h3>
            <p className="text-sm text-gray-600">Shop products</p>
          </Link>
          <Link
            href="/ai"
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition border border-gray-200"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
              <MessageSquare className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900">AI Assistant</h3>
            <p className="text-sm text-gray-600">Get advice</p>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Upcoming Bookings */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Upcoming Bookings</h2>
              <Link href="/bookings" className="text-primary-600 hover:underline text-sm">
                View All
              </Link>
            </div>
            {bookings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No upcoming bookings</p>
                <Link
                  href="/vets"
                  className="inline-block mt-3 text-primary-600 hover:underline"
                >
                  Book a vet
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{booking.vetName}</h3>
                        <p className="text-sm text-gray-600">Pet: {booking.petName}</p>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        {booking.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {booking.date} at {booking.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {booking.address}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Pets */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">My Pets</h2>
              <Link href="/pets" className="text-primary-600 hover:underline text-sm">
                View All
              </Link>
            </div>
            {pets.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <PawPrint className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No pets added yet</p>
                <Link
                  href="/pets/add"
                  className="inline-block mt-3 text-primary-600 hover:underline"
                >
                  Add your first pet
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {pets.map((pet) => (
                  <Link
                    key={pet.id}
                    href={`/pets/${pet.id}`}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition"
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <PawPrint className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{pet.name}</h3>
                      <p className="text-sm text-gray-600">{pet.breed} • {pet.age}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Nearby Vets */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Nearby Veterinarians</h2>
            <Link href="/vets" className="text-primary-600 hover:underline text-sm">
              View All
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {nearbyVets.map((vet) => (
              <Link
                key={vet.id}
                href={`/vets/${vet.id}`}
                className="border rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{vet.name}</h3>
                    <p className="text-sm text-gray-600">{vet.specialty}</p>
                  </div>
                </div>
                <StarRating rating={vet.rating} reviews={vet.reviews} size="sm" />
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  {vet.distance}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

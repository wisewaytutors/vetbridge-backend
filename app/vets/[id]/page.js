'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Star, MapPin, Clock, Phone, Mail, Calendar, ArrowLeft, Share2 } from 'lucide-react';
import { ownerAPI } from '@/lib/api';
import StarRating from '@/components/ui/StarRating';

export default function VetDetailPage({ params }) {
  const router = useRouter();
  const [vet, setVet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  useEffect(() => {
    loadVetDetails();
  }, [params.id]);

  const loadVetDetails = async () => {
    setLoading(true);
    try {
      const response = await ownerAPI.getVetDetails(params.id);
      setVet(response.vet);
    } catch (error) {
      console.error('Failed to load vet details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = () => {
    router.push(`/book?vetId=${params.id}&date=${selectedDate}&time=${selectedTime}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!vet) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Veterinarian not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/vets"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Vets
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vet Header */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-start gap-6">
                <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Star className="w-12 h-12 text-primary-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">{vet.name}</h1>
                      <p className="text-gray-600">{vet.clinic}</p>
                    </div>
                    {vet.available && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full font-medium">
                        Available Now
                      </span>
                    )}
                  </div>
                  <p className="text-primary-600 font-semibold mb-3">{vet.specialty}</p>
                  <StarRating rating={vet.rating} reviews={vet.reviews} />
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {vet.distance}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {vet.hours || 'Mon-Sat 9AM-6PM'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* About */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">About</h2>
              <p className="text-gray-600">
                {vet.bio || `Dr. ${vet.name.split(' ')[1]} is a experienced ${vet.specialty} veterinarian with over 10 years of practice. They are dedicated to providing compassionate care for all pets.`}
              </p>
            </div>

            {/* Services */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Services</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {vet.services?.map((service, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900">{service.name}</h3>
                    <p className="text-primary-600 font-bold">{service.price}</p>
                  </div>
                )) || (
                  <>
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900">General Checkup</h3>
                      <p className="text-primary-600 font-bold">KES 1,500</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900">Vaccination</h3>
                      <p className="text-primary-600 font-bold">KES 2,000</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900">Dental Cleaning</h3>
                      <p className="text-primary-600 font-bold">KES 3,000</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900">Surgery Consultation</h3>
                      <p className="text-primary-600 font-bold">KES 2,500</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Reviews</h2>
              <div className="space-y-4">
                {vet.reviewsList?.map((review, index) => (
                  <div key={index} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-900">{review.author}</span>
                      <StarRating rating={review.rating} size="sm" />
                    </div>
                    <p className="text-gray-600">{review.comment}</p>
                  </div>
                )) || (
                  <p className="text-gray-500">No reviews yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Book Appointment</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Time
                  </label>
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select a time</option>
                    <option value="09:00">9:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="14:00">2:00 PM</option>
                    <option value="15:00">3:00 PM</option>
                    <option value="16:00">4:00 PM</option>
                  </select>
                </div>

                <button
                  onClick={handleBookAppointment}
                  disabled={!selectedDate || !selectedTime}
                  className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Book Appointment
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600 mb-2">Consultation Fee</p>
                <p className="text-2xl font-bold text-primary-600">{vet.price}</p>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Contact</h2>
              <div className="space-y-3">
                <a
                  href={`tel:${vet.phone}`}
                  className="flex items-center gap-3 text-gray-600 hover:text-primary-600"
                >
                  <Phone className="w-5 h-5" />
                  {vet.phone || '+254 712 345 678'}
                </a>
                <a
                  href={`mailto:${vet.email}`}
                  className="flex items-center gap-3 text-gray-600 hover:text-primary-600"
                >
                  <Mail className="w-5 h-5" />
                  {vet.email || 'vet@clinic.ke'}
                </a>
                <div className="flex items-center gap-3 text-gray-600">
                  <MapPin className="w-5 h-5" />
                  {vet.address || '123 Westlands Road, Nairobi'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

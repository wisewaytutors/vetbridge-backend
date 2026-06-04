'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar, Clock, MapPin, PawPrint, ArrowLeft, Check } from 'lucide-react';
import { ownerAPI } from '@/lib/api';
import { auth } from '@/lib/auth';

export default function BookPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState('');
  const [notes, setNotes] = useState('');
  const [vetId, setVetId] = useState(searchParams.get('vetId') || '');
  const [date, setDate] = useState(searchParams.get('date') || '');
  const [time, setTime] = useState(searchParams.get('time') || '');
  const [vet, setVet] = useState(null);

  useEffect(() => {
    if (!auth.isAuthenticated() || auth.getRole() !== 'owner') {
      router.push('/auth/login');
      return;
    }

    loadPets();
    if (vetId) loadVetDetails();
  }, [router, vetId]);

  const loadPets = async () => {
    try {
      const response = await ownerAPI.getPets();
      setPets(response.pets || []);
    } catch (error) {
      console.error('Failed to load pets:', error);
    }
  };

  const loadVetDetails = async () => {
    try {
      const response = await ownerAPI.getVetDetails(vetId);
      setVet(response.vet);
    } catch (error) {
      console.error('Failed to load vet details:', error);
    }
  };

  const handleBook = async (e) => {
    e.preventDefault();
    
    if (!selectedPet || !date || !time || !vetId) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await ownerAPI.createBooking({
        vetId,
        petId: selectedPet,
        date,
        time,
        notes,
      });
      router.push('/dashboard');
    } catch (error) {
      alert('Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href={vetId ? `/vets/${vetId}` : '/vets'}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Book Appointment</h1>
          <p className="text-gray-600">Complete the details below to schedule your visit</p>
        </div>

        {vet && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                <Calendar className="w-8 h-8 text-primary-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{vet.name}</h2>
                <p className="text-gray-600">{vet.clinic}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleBook} className="space-y-6">
          {/* Select Pet */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <PawPrint className="w-5 h-5" />
              Select Pet
            </h2>
            {pets.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <p>No pets added yet</p>
                <Link
                  href="/pets/add"
                  className="inline-block mt-2 text-primary-600 hover:underline"
                >
                  Add your first pet
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {pets.map((pet) => (
                  <button
                    key={pet.id}
                    type="button"
                    onClick={() => setSelectedPet(pet.id)}
                    className={`p-4 rounded-lg border-2 transition ${
                      selectedPet === pet.id
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <PawPrint className="w-6 h-6 text-gray-400" />
                    </div>
                    <h3 className="font-semibold text-gray-900">{pet.name}</h3>
                    <p className="text-sm text-gray-600">{pet.breed}</p>
                    {selectedPet === pet.id && (
                      <div className="mt-2 flex justify-center">
                        <Check className="w-5 h-5 text-primary-600" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date & Time */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Select Date & Time
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time *
                </label>
                <select
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
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
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Additional Notes</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe your pet's symptoms or any special requirements..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Summary */}
          <div className="bg-primary-50 rounded-xl p-6 border border-primary-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Booking Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Veterinarian:</span>
                <span className="font-semibold">{vet?.name || 'Not selected'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pet:</span>
                <span className="font-semibold">{pets.find(p => p.id === selectedPet)?.name || 'Not selected'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-semibold">{date || 'Not selected'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time:</span>
                <span className="font-semibold">{time || 'Not selected'}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-primary-200">
                <span className="text-gray-600">Consultation Fee:</span>
                <span className="font-bold text-primary-600">{vet?.price || 'KES 1,500'}</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !selectedPet || !date || !time}
            className="w-full bg-primary-600 text-white py-4 rounded-lg font-semibold hover:bg-primary-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Booking...' : 'Confirm Booking'}
          </button>
        </form>
      </div>
    </div>
  );
}

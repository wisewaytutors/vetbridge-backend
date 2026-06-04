'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PawPrint, Plus, Calendar, Syringe } from 'lucide-react';
import { auth } from '@/lib/auth';
import { ownerAPI } from '@/lib/api';

export default function PetsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pets, setPets] = useState([]);

  useEffect(() => {
    if (!auth.isAuthenticated() || auth.getRole() !== 'owner') {
      router.push('/auth/login');
      return;
    }

    loadPets();
  }, [router]);

  const loadPets = async () => {
    try {
      const response = await ownerAPI.getPets();
      setPets(response.pets || []);
    } catch (error) {
      console.error('Failed to load pets:', error);
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Pets</h1>
            <p className="text-gray-600">Manage your pet's health records</p>
          </div>
          <Link
            href="/pets/add"
            className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Pet
          </Link>
        </div>

        {pets.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 border border-gray-200 text-center">
            <PawPrint className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">No pets added yet</h2>
            <p className="text-gray-600 mb-4">Add your first pet to get started</p>
            <Link
              href="/pets/add"
              className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition"
            >
              Add Your First Pet
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pets.map((pet) => (
              <Link
                key={pet.id}
                href={`/pets/${pet.id}`}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition border border-gray-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                    <PawPrint className="w-8 h-8 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{pet.name}</h3>
                  <p className="text-gray-600 mb-2">{pet.breed}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <span>{pet.age}</span>
                    <span>•</span>
                    <span>{pet.weight}</span>
                  </div>
                  <div className="space-y-2 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm">
                      <Syringe className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Next vaccination: {pet.nextVaccination}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Last checkup: {pet.lastCheckup}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import { Search, MapPin, Star, Filter, Clock } from 'lucide-react';
import Link from 'next/link';
import { ownerAPI } from '@/lib/api';
import StarRating from '@/components/ui/StarRating';
import EmptyState from '@/components/ui/EmptyState';

export default function VetsPage() {
  const [vets, setVets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'nearby', label: 'Nearby' },
    { id: 'top-rated', label: 'Top Rated' },
    { id: 'available', label: 'Available Now' },
  ];

  const specialties = [
    'General Practice',
    'Surgery',
    'Dental',
    'Emergency',
    'Dermatology',
    'Nutrition',
  ];

  useEffect(() => {
    loadVets();
  }, [selectedFilter, selectedSpecialty]);

  const loadVets = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedFilter !== 'all') params.filter = selectedFilter;
      if (selectedSpecialty) params.specialty = selectedSpecialty;
      if (searchQuery) params.search = searchQuery;

      const response = await ownerAPI.getVets(params);
      setVets(response.vets || []);
    } catch (error) {
      console.error('Failed to load vets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadVets();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Find a Veterinarian</h1>
          <p className="text-gray-600">Browse veterinarians near you</p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, specialty, or clinic..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </form>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setSelectedFilter(filter.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                selectedFilter === filter.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Specialties */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setSelectedSpecialty('')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              !selectedSpecialty
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            All Specialties
          </button>
          {specialties.map((specialty) => (
            <button
              key={specialty}
              onClick={() => setSelectedSpecialty(specialty)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                selectedSpecialty === specialty
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {specialty}
            </button>
          ))}
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : vets.length === 0 ? (
          <EmptyState type="vets" message="No veterinarians found matching your criteria" />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vets.map((vet) => (
              <Link
                key={vet.id}
                href={`/vets/${vet.id}`}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition border border-gray-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                      <Star className="w-8 h-8 text-primary-600" />
                    </div>
                    {vet.available && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                        Available
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{vet.name}</h3>
                  <p className="text-gray-600 mb-2">{vet.clinic}</p>
                  <p className="text-primary-600 font-medium mb-3">{vet.specialty}</p>
                  <StarRating rating={vet.rating} reviews={vet.reviews} />
                  <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    {vet.distance}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-lg font-bold text-primary-600">{vet.price}</p>
                    <p className="text-xs text-gray-500">per consultation</p>
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

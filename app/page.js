import Link from 'next/link';
import { Search, Stethoscope, PawPrint, Heart, MapPin, Star, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-primary-100 py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Your Pet's Health, <span className="text-primary-600">Connected</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Find trusted veterinarians, book appointments instantly, and access AI-powered pet health advice - all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/vets" className="bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-primary-700 transition flex items-center justify-center gap-2">
              <Search className="w-5 h-5" />
              Find a Vet
            </Link>
            <Link href="/auth/login" className="bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition border-2 border-primary-600">
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Why Choose VetBridge?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-xl bg-gray-50 hover:bg-primary-50 transition">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Stethoscope className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Find Trusted Vets</h3>
              <p className="text-gray-600">Browse verified veterinarians with ratings, reviews, and real-time availability.</p>
            </div>
            <div className="text-center p-6 rounded-xl bg-gray-50 hover:bg-primary-50 transition">
              <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PawPrint className="w-8 h-8 text-secondary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Pet Passport</h3>
              <p className="text-gray-600">Keep all your pet's health records, vaccinations, and appointments in one place.</p>
            </div>
            <div className="text-center p-6 rounded-xl bg-gray-50 hover:bg-primary-50 transition">
              <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-accent-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Health Assistant</h3>
              <p className="text-gray-600">Get instant answers to pet health questions with our AI-powered assistant.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
              <h3 className="text-xl font-semibold mb-2">Search for Vets</h3>
              <p className="text-gray-600">Find veterinarians near you by location, specialty, or availability.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
              <h3 className="text-xl font-semibold mb-2">Book Appointment</h3>
              <p className="text-gray-600">Choose a time slot and book your appointment in seconds.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
              <h3 className="text-xl font-semibold mb-2">Visit & Track</h3>
              <p className="text-gray-600">Track your vet's arrival and manage your pet's health records.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Vets */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Featured Veterinarians</h2>
            <Link href="/vets" className="text-primary-600 font-semibold hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Dr. Sarah Kimani', specialty: 'Small Animal', rating: 4.8, reviews: 234, location: 'Westlands, Nairobi' },
              { name: 'Dr. James Ochieng', specialty: 'Surgery', rating: 4.9, reviews: 189, location: 'CBD, Nairobi' },
              { name: 'Dr. Grace Wanjiku', specialty: 'Dental', rating: 4.7, reviews: 156, location: 'Kilimani, Nairobi' },
            ].map((vet, index) => (
              <div key={index} className="border rounded-xl p-6 hover:shadow-lg transition cursor-pointer">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                    <Stethoscope className="w-8 h-8 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{vet.name}</h3>
                    <p className="text-gray-600 text-sm">{vet.specialty}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{vet.rating}</span>
                  <span className="text-gray-500">({vet.reviews} reviews)</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>{vet.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-primary-100 mb-8 text-lg">Join thousands of pet owners who trust VetBridge for their pet's healthcare needs.</p>
          <Link href="/auth/login" className="bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition inline-block">
            Create Free Account
          </Link>
        </div>
      </section>
    </div>
  );
}

import Link from 'next/link';
import { Stethoscope, Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Stethoscope className="w-8 h-8 text-primary-400" />
              <span className="text-xl font-bold">VetBridge</span>
            </Link>
            <p className="text-gray-400 mb-4">
              Connecting pet owners with trusted veterinarians across Kenya.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/vets" className="text-gray-400 hover:text-white transition">
                  Find Vets
                </Link>
              </li>
              <li>
                <Link href="/marketplace" className="text-gray-400 hover:text-white transition">
                  Marketplace
                </Link>
              </li>
              <li>
                <Link href="/ai" className="text-gray-400 hover:text-white transition">
                  AI Assistant
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white transition">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* For Vets */}
          <div>
            <h3 className="font-semibold mb-4">For Veterinarians</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/vet/join" className="text-gray-400 hover:text-white transition">
                  Join as Vet
                </Link>
              </li>
              <li>
                <Link href="/clinic/join" className="text-gray-400 hover:text-white transition">
                  Register Clinic
                </Link>
              </li>
              <li>
                <Link href="/vet-dashboard" className="text-gray-400 hover:text-white transition">
                  Vet Dashboard
                </Link>
              </li>
              <li>
                <Link href="/clinic-dashboard" className="text-gray-400 hover:text-white transition">
                  Clinic Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-gray-400">
                <Mail className="w-4 h-4" />
                <span>support@vetbridge.ke</span>
              </li>
              <li className="flex items-center gap-2 text-gray-400">
                <Phone className="w-4 h-4" />
                <span>+254 712 345 678</span>
              </li>
              <li className="flex items-start gap-2 text-gray-400">
                <MapPin className="w-4 h-4 mt-1" />
                <span>Nairobi, Kenya</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} VetBridge. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

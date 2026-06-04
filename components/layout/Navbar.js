'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X, Stethoscope, User, LogOut, PawPrint, LayoutDashboard, Bell } from 'lucide-react';
import { auth } from '@/lib/auth';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    setIsAuthenticated(auth.isAuthenticated());
    setUserRole(auth.getRole());
  }, []);

  const handleLogout = () => {
    auth.logout();
    setIsAuthenticated(false);
    setUserRole(null);
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <Stethoscope className="w-8 h-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">VetBridge</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/vets" className="text-gray-700 hover:text-primary-600 transition">
              Find Vets
            </Link>
            <Link href="/marketplace" className="text-gray-700 hover:text-primary-600 transition">
              Marketplace
            </Link>
            <Link href="/ai" className="text-gray-700 hover:text-primary-600 transition">
              AI Assistant
            </Link>
            
            {isAuthenticated ? (
              <>
                {userRole === 'owner' && (
                  <Link href="/dashboard" className="text-gray-700 hover:text-primary-600 transition flex items-center gap-1">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                )}
                {userRole === 'vet' && (
                  <Link href="/vet-dashboard" className="text-gray-700 hover:text-primary-600 transition flex items-center gap-1">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                )}
                {userRole === 'clinic' && (
                  <Link href="/clinic-dashboard" className="text-gray-700 hover:text-primary-600 transition flex items-center gap-1">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                )}
                <Link href="/notifications" className="text-gray-700 hover:text-primary-600 transition">
                  <Bell className="w-5 h-5" />
                </Link>
                <div className="relative group">
                  <button className="flex items-center gap-2 text-gray-700 hover:text-primary-600 transition">
                    <User className="w-5 h-5" />
                    <span>Account</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <Link href="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-50">
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-gray-700 hover:text-primary-600 transition">
                  Login
                </Link>
                <Link
                  href="/auth/login"
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-primary-600"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-4 space-y-3">
            <Link href="/vets" className="block text-gray-700 hover:text-primary-600" onClick={() => setIsOpen(false)}>
              Find Vets
            </Link>
            <Link href="/marketplace" className="block text-gray-700 hover:text-primary-600" onClick={() => setIsOpen(false)}>
              Marketplace
            </Link>
            <Link href="/ai" className="block text-gray-700 hover:text-primary-600" onClick={() => setIsOpen(false)}>
              AI Assistant
            </Link>
            
            {isAuthenticated ? (
              <>
                {userRole === 'owner' && (
                  <Link href="/dashboard" className="block text-gray-700 hover:text-primary-600" onClick={() => setIsOpen(false)}>
                    Dashboard
                  </Link>
                )}
                {userRole === 'vet' && (
                  <Link href="/vet-dashboard" className="block text-gray-700 hover:text-primary-600" onClick={() => setIsOpen(false)}>
                    Dashboard
                  </Link>
                )}
                {userRole === 'clinic' && (
                  <Link href="/clinic-dashboard" className="block text-gray-700 hover:text-primary-600" onClick={() => setIsOpen(false)}>
                    Dashboard
                  </Link>
                )}
                <Link href="/notifications" className="block text-gray-700 hover:text-primary-600" onClick={() => setIsOpen(false)}>
                  Notifications
                </Link>
                <Link href="/profile" className="block text-gray-700 hover:text-primary-600" onClick={() => setIsOpen(false)}>
                  Profile
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="w-full text-left text-red-600 hover:text-red-700 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="block text-gray-700 hover:text-primary-600" onClick={() => setIsOpen(false)}>
                  Login
                </Link>
                <Link
                  href="/auth/login"
                  className="block bg-primary-600 text-white px-4 py-2 rounded-lg text-center hover:bg-primary-700"
                  onClick={() => setIsOpen(false)}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

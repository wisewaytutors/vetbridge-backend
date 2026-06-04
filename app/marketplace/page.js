'use client';
import { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Star, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { ownerAPI } from '@/lib/api';
import StarRating from '@/components/ui/StarRating';
import EmptyState from '@/components/ui/EmptyState';

export default function MarketplacePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'food', label: 'Food' },
    { id: 'toys', label: 'Toys' },
    { id: 'accessories', label: 'Accessories' },
    { id: 'medicine', label: 'Medicine' },
  ];

  useEffect(() => {
    loadProducts();
  }, [selectedCategory]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (searchQuery) params.search = searchQuery;

      const response = await ownerAPI.getMarketplaceProducts(params);
      setProducts(response.products || []);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadProducts();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pet Marketplace</h1>
          <p className="text-gray-600">Buy pet products from local sellers</p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </form>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                selectedCategory === category.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : products.length === 0 ? (
          <EmptyState type="marketplace" message="No products found" />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/marketplace/${product.id}`}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition border border-gray-200 overflow-hidden"
              >
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  <ShoppingCart className="w-12 h-12 text-gray-300" />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{product.seller}</p>
                  <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                    <MapPin className="w-3 h-3" />
                    {product.location}
                  </div>
                  <StarRating rating={product.rating} reviews={product.reviews} size="sm" />
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-lg font-bold text-primary-600">{product.price}</p>
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

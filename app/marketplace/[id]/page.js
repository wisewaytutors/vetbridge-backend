'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ShoppingCart, MapPin, Star, MessageCircle, Phone, Plus, Minus } from 'lucide-react';
import { ownerAPI } from '@/lib/api';
import StarRating from '@/components/ui/StarRating';

export default function ProductDetailPage({ params }) {
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    loadProductDetails();
  }, [params.id]);

  const loadProductDetails = async () => {
    setLoading(true);
    try {
      // In a real app, you would have a specific API endpoint for product details
      // For now, we'll simulate it
      const response = await ownerAPI.getMarketplaceProducts();
      const foundProduct = response.products?.find(p => p.id === params.id);
      setProduct(foundProduct);
    } catch (error) {
      console.error('Failed to load product details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    // In a real app, you would add to cart
    alert(`Added ${quantity} item(s) to cart`);
  };

  const handleContactSeller = () => {
    // In a real app, you would open a chat or call
    alert('Contact seller feature coming soon');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Product not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Marketplace
        </Link>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-32 h-32 text-gray-300" />
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <p className="text-gray-600 mb-4">{product.description || 'High quality pet product from trusted local sellers.'}</p>
              
              <div className="flex items-center gap-4 mb-4">
                <StarRating rating={product.rating} reviews={product.reviews} />
                <span className="text-gray-600">({product.reviews} reviews)</span>
              </div>

              <div className="flex items-center gap-2 text-gray-600 mb-4">
                <MapPin className="w-4 h-4" />
                <span>{product.location}</span>
              </div>

              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-bold text-primary-600">{product.price}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-600 mb-6">
                <span className="font-semibold">Seller:</span>
                <span>{product.seller}</span>
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-4 mb-6">
                <span className="font-semibold text-gray-900">Quantity:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Add to Cart
                </button>
                <button
                  onClick={handleContactSeller}
                  className="flex-1 bg-white border border-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Contact Seller
                </button>
              </div>
            </div>

            {/* Seller Info */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Seller Information</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{product.seller}</h3>
                    <p className="text-sm text-gray-600">Verified Seller</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{product.location}</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <button className="flex-1 flex items-center justify-center gap-2 bg-primary-100 text-primary-700 py-2 rounded-lg hover:bg-primary-200 transition">
                    <MessageCircle className="w-4 h-4" />
                    Message
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 bg-secondary-100 text-secondary-700 py-2 rounded-lg hover:bg-secondary-200 transition">
                    <Phone className="w-4 h-4" />
                    Call
                  </button>
                </div>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Delivery Information</h2>
              <div className="space-y-2 text-gray-600">
                <p>• Delivery available within Nairobi</p>
                <p>• Standard delivery: 2-3 business days</p>
                <p>• Express delivery: 1 business day</p>
                <p>• Free delivery on orders over KES 5,000</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

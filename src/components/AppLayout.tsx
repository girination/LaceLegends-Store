import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Product } from '@/contexts/AppContext';
import Navbar from './Navbar';
import Footer from './Footer';
import ProductCard from './ProductCard';
import { ArrowRight, Package, RefreshCw, Shield } from 'lucide-react';

export default function AppLayout() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name)')
        .limit(8)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const mapped = (data || []).map((p: any) => ({
        ...p,
        category: p.category || p.categories?.name || 'Uncategorized',
      }));
      setFeaturedProducts(mapped);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[600px] lg:h-[700px] overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="https://i.pinimg.com/1200x/bc/a5/1e/bca51e95e9a2caf3c1cf9567a8f53d7a.jpg"
              alt="Fashion Hero"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
            <div className="max-w-xl">
              <span className="inline-block px-4 py-1 bg-rose-500 text-white text-sm font-medium rounded-full mb-4">
                New Collection 2026
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                Elevate Your
                <span className="block text-rose-400">Personal Style</span>
              </h1>
              <p className="mt-4 text-lg text-gray-200 max-w-md">
                Discover premium clothing and shoes crafted for the modern individual. Quality meets style in every piece.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/products"
                  className="px-8 py-3 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
                >
                  Shop Now
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/products?category=clothing"
                  className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg backdrop-blur-sm transition-colors border border-white/30"
                >
                  View Collection
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">Shop by Category</h2>
              <p className="mt-2 text-gray-600">Find exactly what you're looking for</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Clothing Category */}
              <Link to="/products?category=clothing" className="group relative h-80 rounded-2xl overflow-hidden">
                <img
                  src="https://d64gsuwffb70l.cloudfront.net/6960ea9f4357157fcc9392a1_1767959312660_eb97329a.jpg"
                  alt="Clothing"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-2xl font-bold text-white">Clothing</h3>
                  <p className="text-gray-200 mt-1">Blazers, Dresses, Sweaters & More</p>
                  <span className="inline-flex items-center gap-2 mt-3 text-rose-400 font-medium group-hover:gap-3 transition-all">
                    Shop Now
                    <ArrowRight className="w-5 h-5" />
                  </span>
                </div>
              </Link>

              {/* Shoes Category */}
              <Link to="/products?category=shoes" className="group relative h-80 rounded-2xl overflow-hidden">
                <img
                  src="https://d64gsuwffb70l.cloudfront.net/6960ea9f4357157fcc9392a1_1767959384935_556db39c.png"
                  alt="Shoes"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-2xl font-bold text-white">Shoes</h3>
                  <p className="text-gray-200 mt-1">Sneakers, Boots, Loafers & More</p>
                  <span className="inline-flex items-center gap-2 mt-3 text-rose-400 font-medium group-hover:gap-3 transition-all">
                    Shop Now
                    <ArrowRight className="w-5 h-5" />
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Featured Products Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-12">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
                <p className="mt-2 text-gray-600">Handpicked styles just for you</p>
              </div>
              <Link
                to="/products"
                className="mt-4 sm:mt-0 inline-flex items-center gap-2 text-rose-600 hover:text-rose-700 font-medium"
              >
                View All Products
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 aspect-[4/5] rounded-xl" />
                    <div className="mt-4 h-4 bg-gray-200 rounded w-3/4" />
                    <div className="mt-2 h-4 bg-gray-200 rounded w-1/4" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Free Shipping */}
              <div className="text-center p-6">
                <div className="w-16 h-16 mx-auto bg-rose-50 rounded-full flex items-center justify-center mb-4">
                  <Package className="w-8 h-8 text-rose-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Free Shipping</h3>
                <p className="mt-2 text-gray-600">Free shipping on orders over $100</p>
              </div>

              {/* Easy Returns */}
              <div className="text-center p-6">
                <div className="w-16 h-16 mx-auto bg-rose-50 rounded-full flex items-center justify-center mb-4">
                  <RefreshCw className="w-8 h-8 text-rose-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Easy Returns</h3>
                <p className="mt-2 text-gray-600">30-day hassle-free return policy</p>
              </div>

              {/* Secure Payment */}
              <div className="text-center p-6">
                <div className="w-16 h-16 mx-auto bg-rose-50 rounded-full flex items-center justify-center mb-4">
                  <Shield className="w-8 h-8 text-rose-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Secure Payment</h3>
                <p className="mt-2 text-gray-600">100% secure payment processing</p>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-16 bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-white">Stay in Style</h2>
              <p className="mt-4 text-gray-400">
                Subscribe to our newsletter for exclusive offers, new arrivals, and style tips.
              </p>
              <form className="mt-8 flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rose-500"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-lg transition-colors"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

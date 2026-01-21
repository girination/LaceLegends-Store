import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Product } from '@/contexts/AppContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { Search, Frown, Loader2, AlertCircle } from 'lucide-react';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState(categoryParam || 'all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoriesList, setCategoriesList] = useState<{ id: string; name: string }[]>([]);

  // Update category when URL param changes
  useEffect(() => {
    if (categoryParam) {
      setCategory(categoryParam);
    }
  }, [categoryParam]);

  // Fetch products when filters change
  useEffect(() => {
    fetchProducts();
  }, [category, sortBy]);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (categoriesError) throw categoriesError;
      setCategoriesList(categoriesData || []);

      // Build products query
      let query = supabase.from('products').select('*');

      // Apply category filter
      if (category !== 'all') {
        const catStr = String(category);
        
        // Try to match by name first
        const matchedByName = (categoriesData || []).find(
          (c: any) => c.name?.toLowerCase() === catStr.toLowerCase()
        );
        
        // Try to match by ID second
        const matchedById = (categoriesData || []).find(
          (c: any) => c.id === catStr
        );

        if (matchedByName) {
          query = query.eq('category_id', matchedByName.id);
        } else if (matchedById) {
          query = query.eq('category_id', matchedById.id);
        } else {
          // Fallback: try direct string match in case some products
          // have category stored as plain string
          query = query.eq('category_id', catStr);
        }
      }

      // Apply sorting
      switch (sortBy) {
        case 'price-low':
          query = query.order('price', { ascending: true });
          break;
        case 'price-high':
          query = query.order('price', { ascending: false });
          break;
        case 'name':
          query = query.order('name', { ascending: true });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data: productsData, error: productsError } = await query;

      if (productsError) throw productsError;

      // Map category_id to category name for display
      const mappedProducts = (productsData || []).map((p: any) => ({
        ...p,
        category:
          (categoriesData || []).find((c: any) => c.id === p.category_id)?.name ||
          'Uncategorized',
      }));

      setProducts(mappedProducts);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.message || 'Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle category change
  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    
    // Update URL params
    if (newCategory === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', newCategory);
    }
    setSearchParams(searchParams);
  };

  // Filter products by search query
  const filteredProducts = products.filter((product) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchLower) ||
      product.description?.toLowerCase().includes(searchLower) ||
      product.category?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {category === 'all'
                ? 'All Products'
                : category.charAt(0).toUpperCase() + category.slice(1)}
            </h1>
            <p className="mt-2 text-gray-600">
              {loading ? (
                'Loading products...'
              ) : (
                <>
                  {filteredProducts.length}{' '}
                  {filteredProducts.length === 1 ? 'product' : 'products'} found
                </>
              )}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3 items-start">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-1">Error Loading Products</h3>
                <p className="text-sm text-red-800">{error}</p>
                <button
                  onClick={fetchProducts}
                  className="mt-2 text-sm font-medium text-red-600 hover:text-red-700 underline"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Filters and Search */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-8">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Category:
                </span>
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                  disabled={loading}
                >
                  <option value="all">All Categories</option>
                  {categoriesList.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name.charAt(0).toUpperCase() + c.name.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Sort by:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                  disabled={loading}
                >
                  <option value="newest">Newest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 aspect-[4/5] rounded-xl" />
                  <div className="mt-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-5 bg-gray-200 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl">
              <Frown className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No products found
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery
                  ? `No products match "${searchQuery}"`
                  : 'Try adjusting your filters'}
              </p>
              {(searchQuery || category !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    handleCategoryChange('all');
                  }}
                  className="text-rose-600 hover:text-rose-700 font-medium"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
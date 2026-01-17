import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAppContext, Product } from '@/contexts/AppContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { Minus, Plus, ShoppingBag, Check, Loader2, ArrowLeft, Frown } from 'lucide-react';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useAppContext();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [showAdded, setShowAdded] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      // Fetch product
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('id', id)
        .single();

      if (productError) throw productError;
      setProduct(productData);

      // Fetch related products
      const { data: relatedData, error: relatedError } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('category', productData.category)
        .neq('id', id)
        .limit(4);

      if (!relatedError) {
        const mapped = (relatedData || []).map((p: any) => ({
          ...p,
          category: p.category || p.categories?.name || 'Uncategorized',
        }));
        setRelatedProducts(mapped);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BWP',
    }).format(price);
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    setIsAdding(true);
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }

    setTimeout(() => {
      setIsAdding(false);
      setShowAdded(true);
      setTimeout(() => setShowAdded(false), 2000);
    }, 300);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="bg-gray-200 aspect-square rounded-2xl" />
                <div>
                  <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
                  <div className="h-6 bg-gray-200 rounded w-1/4 mb-6" />
                  <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Frown className="w-16 h-16 mx-auto text-gray-400" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Product not found</h2>
            <p className="mt-2 text-gray-600">The product you're looking for doesn't exist.</p>
            <Link
              to="/products"
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white font-medium rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Products
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
            <Link to="/" className="hover:text-gray-900 transition-colors">Home</Link>
            <span>/</span>
            <Link to="/products" className="hover:text-gray-900 transition-colors">Products</Link>
            <span>/</span>
            <Link to={`/products?category=${product.category}`} className="hover:text-gray-900 transition-colors capitalize">
              {product.category}
            </Link>
            <span>/</span>
            <span className="text-gray-900">{product.name}</span>
          </nav>

          {/* Product Details */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              {/* Product Image */}
              <div className="bg-gray-100 p-8 lg:p-12">
                <div className="aspect-square rounded-xl overflow-hidden">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Product Info */}
              <div className="p-8 lg:p-12 flex flex-col">
                <div className="flex-1">
                  <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full capitalize mb-4">
                    {product.category}
                  </span>
                  
                  <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
                  
                  <p className="mt-4 text-3xl font-bold text-rose-600">
                    {formatPrice(product.price)}
                  </p>

                  <p className="mt-6 text-gray-600 leading-relaxed">
                    {product.description}
                  </p>

                  {/* Quantity Selector */}
                  <div className="mt-8">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border border-gray-300 rounded-lg">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors rounded-l-lg"
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                        <span className="w-14 text-center font-medium text-gray-900">
                          {quantity}
                        </span>
                        <button
                          onClick={() => setQuantity(quantity + 1)}
                          className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors rounded-r-lg"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                      <span className="text-sm text-gray-500">
                        {product.stock || 100} in stock
                      </span>
                    </div>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <div className="mt-8 space-y-4">
                  <button
                    onClick={handleAddToCart}
                    disabled={isAdding}
                    className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                      showAdded
                        ? 'bg-green-500 text-white'
                        : 'bg-rose-500 hover:bg-rose-600 text-white'
                    }`}
                  >
                    {isAdding ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : showAdded ? (
                      <>
                        <Check className="w-6 h-6" />
                        Added to Cart!
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-6 h-6" />
                        Add to Cart - {formatPrice(product.price * quantity)}
                      </>
                    )}
                  </button>

                  <Link
                    to="/cart"
                    className="block w-full py-4 text-center border-2 border-gray-300 hover:border-gray-400 text-gray-700 rounded-xl font-semibold transition-colors"
                  >
                    View Cart
                  </Link>
                </div>

                {/* Features */}
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500" />
                      <span className="text-sm text-gray-600">Free shipping over $100</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500" />
                      <span className="text-sm text-gray-600">30-day returns</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500" />
                      <span className="text-sm text-gray-600">Secure checkout</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500" />
                      <span className="text-sm text-gray-600">Premium quality</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-16">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">You May Also Like</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

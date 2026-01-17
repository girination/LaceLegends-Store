import { Link } from 'react-router-dom';
import { useAppContext, Product } from '@/contexts/AppContext';
import { useState } from 'react';
import { Plus, Check, Loader2 } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);
  const [showAdded, setShowAdded] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAdding(true);
    
    addToCart(product);

    setTimeout(() => {
      setIsAdding(false);
      setShowAdded(true);
      setTimeout(() => setShowAdded(false), 1500);
    }, 300);
  };

  return (
    <Link to={`/products/${product.id}`} className="group block">
      <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
        {/* Image container */}
        <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
          <img
            src={product.image_data || product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          
          {/* Category badge */}
          <div className="absolute top-3 left-3">
            <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700 rounded-full capitalize">
              {product.category}
            </span>
          </div>

          {/* Quick add button */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={handleAddToCart}
              disabled={isAdding}
              className={`w-full py-2.5 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center space-x-2 ${
                showAdded
                  ? 'bg-green-500 text-white'
                  : 'bg-white text-gray-900 hover:bg-rose-500 hover:text-white'
              }`}
            >
              {isAdding ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : showAdded ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>Added!</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span>Quick Add</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Product info */}
        <div className="p-4">
          <h3 className="font-medium text-gray-900 group-hover:text-rose-600 transition-colors line-clamp-1">
            {product.name}
          </h3>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {formatPrice(product.price)}
          </p>
        </div>
      </div>
    </Link>
  );
}

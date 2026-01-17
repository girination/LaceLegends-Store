import { Link, useLocation } from 'react-router-dom';
import { useAppContext } from '@/contexts/AppContext';
import { useState } from 'react';
import { ShoppingBag, Menu, X, User, LogOut } from 'lucide-react';

export default function Navbar() {
  const { getCartCount, isAdmin, adminLogout } = useAppContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const cartCount = getCartCount();

  const isActive = (path: string) => location.pathname === path;

  // Render a simplified admin navbar when on admin routes
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-rose-600 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">LaceLegends</span>
          </Link>

          {/* Desktop Navigation */}
          {!isAdminRoute ? (
            <div className="hidden md:flex items-center space-x-8">
              <Link 
                to="/" 
                className={`font-medium transition-colors ${isActive('/') ? 'text-rose-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Home
              </Link>
              <Link 
                to="/products" 
                className={`font-medium transition-colors ${isActive('/products') ? 'text-rose-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Shop
              </Link>
              <Link 
                to="/products?category=clothing" 
                className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
              >
                Clothing
              </Link>
              <Link 
                to="/products?category=shoes" 
                className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
              >
                Shoes
              </Link>
            </div>
          ) : (
            // Admin route: show minimal breadcrumb / dashboard link
            <div className="hidden md:flex items-center space-x-6">
              <Link to="/admin/dashboard" className="font-medium text-rose-600">Admin Dashboard</Link>
              <Link to="/" className="text-gray-500 hover:text-gray-700 font-medium">View Store</Link>
            </div>
          )}

          {/* Right side icons */}
          <div className="flex items-center space-x-4">
            {/* Admin link */}
            {isAdmin && (
              <div className="hidden md:flex items-center space-x-3">
                <Link
                  to="/admin/dashboard"
                  className="text-rose-600 hover:text-rose-700 font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={adminLogout}
                  className="text-gray-500 hover:text-gray-700 text-sm transition-colors flex items-center gap-1"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Cart */}
            <Link to="/cart" className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors">
              <ShoppingBag className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-3">
              {!isAdminRoute ? (
                <>
                  <Link
                    to="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-gray-600 hover:text-gray-900 font-medium px-2 py-1"
                  >
                    Home
                  </Link>
                  <Link
                    to="/products"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-gray-600 hover:text-gray-900 font-medium px-2 py-1"
                  >
                    Shop All
                  </Link>
                  <Link
                    to="/products?category=clothing"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-gray-600 hover:text-gray-900 font-medium px-2 py-1"
                  >
                    Clothing
                  </Link>
                  <Link
                    to="/products?category=shoes"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-gray-600 hover:text-gray-900 font-medium px-2 py-1"
                  >
                    Shoes
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/admin/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-rose-600 font-medium px-2 py-1"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-gray-600 hover:text-gray-900 font-medium px-2 py-1"
                  >
                    View Store
                  </Link>
                </>
              )}

              {isAdmin && !isAdminRoute && (
                <>
                  <Link
                    to="/admin/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-rose-600 font-medium px-2 py-1"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      adminLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="text-gray-500 text-left px-2 py-1"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

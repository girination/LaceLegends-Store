import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAppContext, Product, Order } from '@/contexts/AppContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  LogOut,
  Package,
  ClipboardList,
  DollarSign,
  Clock,
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  Upload,
  AlertCircle,
} from 'lucide-react';

/* ===================== IMAGE UPLOAD UTILITIES ===================== */

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Validates image file before upload
 */
const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return { 
      valid: false, 
      error: 'Invalid file type. Please upload JPG, PNG, WebP, or GIF images.' 
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB` 
    };
  }

  return { valid: true };
};

/**
 * Compresses and optimizes image before upload
 */
const compressImage = (file: File, maxWidth = 1200, quality = 0.85): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        
        // Resize if needed
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          file.type,
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
};

/**
 * Uploads product image to Supabase Storage with retry logic
 */
const uploadProductImage = async (
  file: File,
  retries = 3
): Promise<UploadResult> => {
  // Validate file
  const validation = validateImageFile(file);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    // Compress image
    const compressedBlob = await compressImage(file);
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `products/${fileName}`;

    // Upload with retry logic
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, compressedBlob, {
            contentType: file.type,
            upsert: false,
            cacheControl: '3600',
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        return { success: true, url: urlData.publicUrl };
        
      } catch (error: any) {
        lastError = error;
        if (attempt < retries - 1) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    throw lastError || new Error('Upload failed after retries');
    
  } catch (error: any) {
    console.error('Image upload error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to upload image. Please try again.' 
    };
  }
};

/**
 * Deletes image from Supabase Storage
 */
const deleteProductImage = async (imageUrl: string): Promise<boolean> => {
  try {
    // Extract file path from URL
    const urlParts = imageUrl.split('/product-images/');
    if (urlParts.length < 2) return false;
    
    const filePath = urlParts[1];
    
    const { error } = await supabase.storage
      .from('product-images')
      .remove([`products/${filePath}`]);
    
    if (error) {
      console.error('Error deleting image:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteProductImage:', error);
    return false;
  }
};

/* ===================== ADMIN DASHBOARD ===================== */

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isAdmin, isAuthLoading, adminLogout } = useAppContext();

  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
  });

  useEffect(() => {
    if (!isAuthLoading && !isAdmin) navigate('/admin');
  }, [isAuthLoading, isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin]);

  const fetchData = async () => {
    setLoadingData(true);

    try {
      // Fetch categories
      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (catError) throw catError;
      setCategories(catData || []);

      // Fetch products
      const { data: prodData, error: prodError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (prodError) throw prodError;

      const mappedProducts =
        prodData?.map((p: any) => ({
          ...p,
          category:
            catData?.find((c) => c.id === p.category_id)?.name || 'Uncategorized',
        })) || [];

      setProducts(mappedProducts);

      // Fetch orders
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*, order_items (*)')
        .order('created_at', { ascending: false });

      if (orderError) throw orderError;
      setOrders(orderData || []);

      // Calculate stats
      setStats({
        totalProducts: mappedProducts.length,
        totalOrders: orderData?.length || 0,
        pendingOrders:
          orderData?.filter((o) => o.status === 'pending').length || 0,
        totalRevenue:
          orderData?.reduce((s, o) => s + Number(o.total_price), 0) || 0,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to load dashboard data. Please refresh the page.');
    } finally {
      setLoadingData(false);
    }
  };

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('en-BW', {
      style: 'currency',
      currency: 'BWP',
    }).format(n);

  const handleDeleteProduct = async (id: string, imageUrl?: string) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete image from storage if exists
      if (imageUrl) {
        await deleteProductImage(imageUrl);
      }

      // Delete product from database
      const { error } = await supabase.from('products').delete().eq('id', id);
      
      if (error) throw error;
      
      await fetchData();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product. Please try again.');
    }
  };

  if (isAuthLoading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <button
            onClick={adminLogout}
            className="flex gap-2 items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Stat icon={<Package />} label="Products" value={stats.totalProducts} />
          <Stat icon={<ClipboardList />} label="Orders" value={stats.totalOrders} />
          <Stat icon={<Clock />} label="Pending" value={stats.pendingOrders} />
          <Stat
            icon={<DollarSign />}
            label="Revenue"
            value={formatPrice(stats.totalRevenue)}
          />
        </div>

        {/* TABS */}
        <div className="flex gap-6 border-b mb-6">
          <button
            className={`pb-2 px-1 transition-all ${
              activeTab === 'products'
                ? 'font-semibold border-b-2 border-rose-500 text-rose-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('products')}
          >
            Products ({products.length})
          </button>
          <button
            className={`pb-2 px-1 transition-all ${
              activeTab === 'orders'
                ? 'font-semibold border-b-2 border-rose-500 text-rose-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('orders')}
          >
            Orders ({orders.length})
          </button>
        </div>

        {/* CONTENT */}
        {loadingData ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
          </div>
        ) : activeTab === 'products' ? (
          <>
            <button
              onClick={() => {
                setEditingProduct(null);
                setIsModalOpen(true);
              }}
              className="mb-4 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg flex gap-2 items-center transition-colors"
            >
              <Plus size={18} /> Add Product
            </button>

            {products.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg">
                <Package className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600">No products yet. Add your first product!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow flex justify-between items-center"
                  >
                    <div className="flex gap-4 items-center">
                      <img
                        src={p.image_url || '/placeholder-product.jpg'}
                        alt={p.name}
                        className="w-24 h-24 object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
                        }}
                      />
                      <div>
                        <h3 className="font-semibold text-lg">{p.name}</h3>
                        <p className="text-sm text-gray-500">{p.category}</p>
                        <p className="text-rose-600 font-medium mt-1">
                          {formatPrice(p.price)}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingProduct(p);
                          setIsModalOpen(true);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit product"
                      >
                        <Edit2 size={18} className="text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id, p.image_url)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete product"
                      >
                        <Trash2 size={18} className="text-red-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg">
                <ClipboardList className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600">No orders yet.</p>
              </div>
            ) : (
              orders.map((o) => (
                <div key={o.id} className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        Order #{o.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(o.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-rose-600">
                        {formatPrice(o.total_price)}
                      </p>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          o.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : o.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {o.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {isModalOpen && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          onClose={() => setIsModalOpen(false)}
          onSave={() => {
            setIsModalOpen(false);
            fetchData();
          }}
        />
      )}

      <Footer />
    </div>
  );
}

/* ===================== PRODUCT MODAL ===================== */

function ProductModal({
  product,
  categories,
  onClose,
  onSave,
}: {
  product: Product | null;
  categories: { id: string; name: string }[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [price, setPrice] = useState(product?.price?.toString() || '');
  const [categoryId, setCategoryId] = useState(product?.category || '');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(product?.image_url || null);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file
    const validation = validateImageFile(selectedFile);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      setFile(null);
      setPreview(null);
      return;
    }

    setError(null);
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      setError('Product name is required');
      return;
    }

    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      setError('Please enter a valid price');
      return;
    }

    if (!file && !product?.image_url) {
      setError('Please upload a product image');
      return;
    }

    setSaving(true);
    setError(null);
    setUploadProgress(0);

    try {
      let imageUrl = product?.image_url || null;

      // Upload new image if selected
      if (file) {
        setUploadProgress(30);
        
        const uploadResult = await uploadProductImage(file);
        
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Failed to upload image');
        }

        // Delete old image if updating product
        if (product?.image_url && imageUrl !== uploadResult.url) {
          await deleteProductImage(product.image_url);
        }

        imageUrl = uploadResult.url || null;
        setUploadProgress(70);
      }

      // Prepare product data
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        price: Number(price),
        category_id: categoryId || null,
        image_url: imageUrl,
      };

      setUploadProgress(90);

      // Save to database
      if (product) {
        const { error: updateError } = await supabase
          .from('products')
          .update(payload)
          .eq('id', product.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('products')
          .insert(payload);

        if (insertError) throw insertError;
      }

      setUploadProgress(100);
      onSave();
    } catch (err: any) {
      console.error('Error saving product:', err);
      setError(err.message || 'Failed to save product. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-lg p-6 my-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-xl">
            {product ? 'Edit Product' : 'Add Product'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={saving}
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2 items-start">
            <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name *
            </label>
            <input
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              placeholder="Enter product name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent min-h-[100px] resize-y"
              placeholder="Enter product description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price (BWP) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={saving}
            >
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Image * {!product && <span className="text-gray-500">(Max 5MB)</span>}
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-rose-500 transition-colors">
              <input
                type="file"
                accept={ALLOWED_FILE_TYPES.join(',')}
                onChange={handleFileChange}
                disabled={saving}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center cursor-pointer"
              >
                {preview ? (
                  <div className="relative">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full max-w-xs h-48 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                      <Upload className="text-white" size={32} />
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="text-gray-400 mb-2" size={32} />
                    <p className="text-sm text-gray-600">Click to upload image</p>
                    <p className="text-xs text-gray-500 mt-1">
                      JPG, PNG, WebP or GIF (Max 5MB)
                    </p>
                  </>
                )}
              </label>
            </div>
          </div>

          {saving && uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-rose-500 h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 text-center">
                {uploadProgress < 100 ? 'Uploading...' : 'Finalizing...'}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-2 rounded-lg flex gap-2 items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {uploadProgress < 100 ? 'Uploading...' : 'Saving...'}
              </>
            ) : (
              'Save Product'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===================== STAT CARD ===================== */

function Stat({
  icon,
  label,
  value,
}: {
  icon: JSX.Element;
  label: string;
  value: any;
}) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm flex gap-4 items-center hover:shadow-md transition-shadow">
      <div className="text-rose-500">{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-bold text-lg">{value}</p>
      </div>
    </div>
  );
}
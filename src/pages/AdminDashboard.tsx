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
  ChevronDown,
  X,
  Loader2,
} from 'lucide-react';

/* ===================== STORAGE HELPER ===================== */

const uploadProductImage = async (file: File) => {
  const ext = file.name.split('.').pop();
  const filePath = `products/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from('product-images')
    .upload(filePath, file, { upsert: true });

  if (error) throw error;

  const { data } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

/* ===================== ADMIN DASHBOARD ===================== */

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isAdmin, isAuthLoading, adminLogout } = useAppContext();

  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    []
  );
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

    const { data: catData } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    setCategories(catData || []);

    const { data: prodData } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    const mappedProducts =
      prodData?.map((p: any) => ({
        ...p,
        category:
          catData?.find((c) => c.id === p.category_id)?.name ||
          'Uncategorized',
      })) || [];

    setProducts(mappedProducts);

    const { data: orderData } = await supabase
      .from('orders')
      .select('*, order_items (*)')
      .order('created_at', { ascending: false });

    setOrders(orderData || []);

    setStats({
      totalProducts: mappedProducts.length,
      totalOrders: orderData?.length || 0,
      pendingOrders:
        orderData?.filter((o) => o.status === 'pending').length || 0,
      totalRevenue:
        orderData?.reduce((s, o) => s + Number(o.total_price), 0) || 0,
    });

    setLoadingData(false);
  };

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('en-BW', {
      style: 'currency',
      currency: 'BWP',
    }).format(n);

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await supabase.from('products').delete().eq('id', id);
    fetchData();
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

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <button
            onClick={adminLogout}
            className="flex gap-2 items-center text-gray-600"
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
            className={activeTab === 'products' ? 'font-semibold' : ''}
            onClick={() => setActiveTab('products')}
          >
            Products ({products.length})
          </button>
          <button
            className={activeTab === 'orders' ? 'font-semibold' : ''}
            onClick={() => setActiveTab('orders')}
          >
            Orders ({orders.length})
          </button>
        </div>

        {/* CONTENT */}
        {loadingData ? (
          <Loader2 className="animate-spin" />
        ) : activeTab === 'products' ? (
          <>
            <button
              onClick={() => {
                setEditingProduct(null);
                setIsModalOpen(true);
              }}
              className="mb-4 bg-rose-500 text-white px-4 py-2 rounded flex gap-2"
            >
              <Plus size={18} /> Add Product
            </button>

            {products.map((p) => (
              <div
                key={p.id}
                className="bg-white p-4 rounded shadow flex justify-between mb-4"
              >
                <div className="flex gap-4">
                  <img
                    src={p.image_url}
                    className="w-24 h-24 object-cover rounded"
                  />
                  <div>
                    <h3 className="font-semibold">{p.name}</h3>
                    <p className="text-sm text-gray-500">{p.category}</p>
                    <p className="text-rose-600 font-medium">
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
                  >
                    <Edit2 />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(p.id)}
                    className="text-red-600"
                  >
                    <Trash2 />
                  </button>
                </div>
              </div>
            ))}
          </>
        ) : (
          orders.map((o) => (
            <div key={o.id} className="bg-white p-4 rounded shadow mb-3">
              <p className="font-medium">
                Order #{o.id.slice(0, 8).toUpperCase()}
              </p>
              <p className="text-gray-600">
                {formatPrice(o.total_price)}
              </p>
            </div>
          ))
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
  const [category, setCategory] = useState(product?.category|| '');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(
    product?.image_url || null
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);

    let imageUrl = product?.image_url || null;
    if (file) imageUrl = await uploadProductImage(file);

    const payload = {
      name,
      description,
      price: Number(price),
      category_id: category || null,
      image_url: imageUrl,
    };

    product
      ? await supabase.from('products').update(payload).eq('id', product.id)
      : await supabase.from('products').insert(payload);

    setSaving(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-lg p-6">
        <div className="flex justify-between mb-4">
          <h2 className="font-semibold text-lg">
            {product ? 'Edit Product' : 'Add Product'}
          </h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        <input
          className="w-full border p-2 mb-2"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <textarea
          className="w-full border p-2 mb-2"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <input
          type="number"
          className="w-full border p-2 mb-2"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />

        <select
          className="w-full border p-2 mb-2"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">Uncategorized</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              setFile(f);
              setPreview(URL.createObjectURL(f));
            }
          }}
        />

        {preview && (
          <img
            src={preview}
            className="w-32 h-32 object-cover mt-3 rounded"
          />
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose}>Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-rose-500 text-white px-4 py-2 rounded"
          >
            {saving ? 'Saving…' : 'Save'}
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
    <div className="bg-white p-4 rounded shadow flex gap-4 items-center">
      {icon}
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-bold">{value}</p>
      </div>
    </div>
  );
}

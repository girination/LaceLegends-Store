import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Lock, AlertCircle, Loader2 } from 'lucide-react';

export default function AdminSignup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Standard Supabase Auth signup
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (signUpError || !data.user) {
        setError(signUpError?.message || 'Signup failed');
        setLoading(false);
        return;
      }

      // Assign admin role (insert into admin_roles). The user must be able to insert their own role per RLS.
      const { error: roleError } = await supabase
        .from('admin_roles')
        .insert({
          user_id: data.user.id,
          role: 'admin',
        });

      if (roleError) {
        setError('Failed to assign admin role. You may need to promote this user via the dashboard or CLI.');
        setLoading(false);
        return;
      }

      navigate('/admin/login');
    } catch (err) {
      console.error(err);
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto bg-rose-500 rounded-2xl flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Admin Sign Up</h1>
            <p className="text-gray-600 mt-1">
              Create an administrator account
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <input
              type="email"
              placeholder="Admin email"
              required
              className="w-full px-4 py-3 border rounded-lg"
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />

            <input
              type="password"
              placeholder="Password"
              required
              className="w-full px-4 py-3 border rounded-lg"
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />

            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex gap-2">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-rose-500 text-white rounded-lg flex justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Admin Account'
              )}
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}

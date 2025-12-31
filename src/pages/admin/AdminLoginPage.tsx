import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import supabase from '../../utils/supabaseClient';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    (async () => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          alert(error.message);
          return;
        }
        
        if (!data.user) {
          alert('Login failed');
          return;
        }
        
        // Check user role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();
        
        if (profileError) {
          console.error('Profile fetch error:', profileError);
          alert('Failed to fetch user profile');
          return;
        }
        
        // Check if user is an admin
        if (profile.role !== 'admin') {
          alert('Access denied. This portal is for administrators only.');
          await supabase.auth.signOut();
          return;
        }
        
        navigate('/admin/dashboard');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        alert(msg || 'Login failed');
      }
    })();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-white px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Shield size={64} className="text-blue-800 mx-auto" />
          <h1 className="text-3xl font-bold text-gray-900 mt-4">JRM INFOSYSTEMS</h1>
          <p className="text-gray-600">Employee Onboarding Management</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Admin Portal</h2>
            <span className="text-xs bg-red-50 text-red-600 px-3 py-1 rounded-full">Authorized Personnel Only</span>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="form-label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="admin@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10 pr-10"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="w-4 h-4" />
                Remember me
              </label>
              <a href="#" className="text-sm text-blue-800 hover:underline">Forgot Password?</a>
            </div>

            <button type="submit" className="w-full bg-[#1e40af] hover:bg-[#1b3a9a] text-white py-3 rounded-md font-medium transition">
              Login to Dashboard
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-600 mt-6">Logged in admins can manage applications and verify documents.</p>
      </div>
    </div>
  );
}

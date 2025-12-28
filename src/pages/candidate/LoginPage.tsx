import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import supabase from '../../utils/supabaseClient';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
          .eq('user_id', data.user.id)
          .single();
        
        if (profileError) {
          console.error('Profile fetch error:', profileError);
          alert('Failed to fetch user profile');
          return;
        }
        
        // Check if user is a candidate
        if (profile.role !== 'candidate') {
          alert('Access denied. This portal is for candidates only. Please use the admin portal.');
          await supabase.auth.signOut();
          return;
        }
        
        navigate('/candidate/dashboard');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        alert(msg || 'Login failed');
      }
    })();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">JRM INFOSYSTEMS PRIVATE LIMITED</h1>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Candidate Login</h2>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="form-label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input-field pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <a href="#" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Forgot Password?
              </a>
            </div>

            {/* Login Button */}
            <button type="submit" className="btn-primary w-full">
              Login
            </button>
          </form>

          {/* Footer Text */}
          <p className="text-center text-sm text-gray-600 mt-6">
            First time here? Check your email for login credentials
          </p>
        </div>
      </div>
    </div>
  );
}

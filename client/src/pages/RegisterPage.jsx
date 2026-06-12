import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Car, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', role: 'PASSENGER',
    vehicleNumber: '', licenseNumber: '', vehicleType: 'E-Rickshaw',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await register(form);
      toast.success('Account created successfully!');
      if (user.role === 'DRIVER') navigate('/driver/onboarding');
      else navigate('/passenger');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center">
            <Car className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">CampusRide</span>
        </div>

        <h2 className="text-2xl font-bold text-white mb-1">Create account</h2>
        <p className="text-slate-400 text-sm mb-6">Join CampusRide at IIT Roorkee</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role selector */}
          <div>
            <label className="text-sm text-slate-300 font-medium mb-2 block">I am a</label>
            <div className="grid grid-cols-2 gap-3">
              {['PASSENGER', 'DRIVER'].map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, role }))}
                  className={`py-3 rounded-lg border text-sm font-semibold transition-all ${
                    form.role === role
                      ? 'bg-brand-600/20 border-brand-500 text-brand-400'
                      : 'bg-panel border-border text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {role === 'PASSENGER' ? '🧑 Passenger' : '🚗 Driver'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm text-slate-300 font-medium mb-1.5 block">Full Name</label>
              <input type="text" placeholder="Rahul Sharma" value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="input-field" required />
            </div>
            <div className="col-span-2">
              <label className="text-sm text-slate-300 font-medium mb-1.5 block">Email</label>
              <input type="email" placeholder="you@iitr.ac.in" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="input-field" required />
            </div>
            <div className="col-span-2">
              <label className="text-sm text-slate-300 font-medium mb-1.5 block">Phone (optional)</label>
              <input type="tel" placeholder="9876543210" value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                className="input-field" />
            </div>
            <div className="col-span-2">
              <label className="text-sm text-slate-300 font-medium mb-1.5 block">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} placeholder="Min. 6 characters" value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="input-field pr-10" required minLength={6} />
                <button type="button" onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Driver-specific fields */}
          {form.role === 'DRIVER' && (
            <div className="space-y-4 p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
              <p className="text-xs text-blue-400 font-semibold uppercase tracking-wide">Vehicle Information</p>
              <div>
                <label className="text-sm text-slate-300 font-medium mb-1.5 block">Vehicle Number</label>
                <input type="text" placeholder="UK07-ER-0001" value={form.vehicleNumber}
                  onChange={e => setForm(p => ({ ...p, vehicleNumber: e.target.value }))}
                  className="input-field" />
              </div>
              <div>
                <label className="text-sm text-slate-300 font-medium mb-1.5 block">License Number</label>
                <input type="text" placeholder="UK0720230001" value={form.licenseNumber}
                  onChange={e => setForm(p => ({ ...p, licenseNumber: e.target.value }))}
                  className="input-field" />
              </div>
              <p className="text-xs text-slate-500">Vehicle info can also be added after registration from the onboarding page.</p>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating account...</>
            ) : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

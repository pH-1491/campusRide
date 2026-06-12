import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Car, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DriverOnboarding() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    vehicleNumber: '', licenseNumber: '', vehicleType: 'E-Rickshaw',
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/drivers/onboard', form);
      setDone(true);
      toast.success('Vehicle registered! Awaiting admin verification.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register vehicle');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="p-6 max-w-md mx-auto flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 bg-brand-600/20 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-brand-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Registration Submitted</h2>
        <p className="text-slate-400 text-center text-sm mb-6">
          Your vehicle has been registered. An admin will verify your account shortly. You'll be able to go online once verified.
        </p>
        <button onClick={() => navigate('/driver')} className="btn-primary px-8">
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
          <Car className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Driver Onboarding</h1>
          <p className="text-slate-400 text-sm">Register your vehicle to start driving</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-sm text-slate-300 font-medium mb-1.5 block">Vehicle Type</label>
          <select
            value={form.vehicleType}
            onChange={e => setForm(p => ({ ...p, vehicleType: e.target.value }))}
            className="input-field"
          >
            <option value="E-Rickshaw">E-Rickshaw</option>
            <option value="Golf Cart">Golf Cart</option>
            <option value="Auto Rickshaw">Auto Rickshaw</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-slate-300 font-medium mb-1.5 block">Vehicle Number</label>
          <input
            type="text"
            placeholder="UK07-ER-0001"
            value={form.vehicleNumber}
            onChange={e => setForm(p => ({ ...p, vehicleNumber: e.target.value }))}
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="text-sm text-slate-300 font-medium mb-1.5 block">Driver's License Number</label>
          <input
            type="text"
            placeholder="UK0720230001"
            value={form.licenseNumber}
            onChange={e => setForm(p => ({ ...p, licenseNumber: e.target.value }))}
            className="input-field"
            required
          />
        </div>

        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300">
          ⚠️ After registration, an admin must verify your account before you can go online.
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
          {loading ? 'Registering...' : 'Register Vehicle'}
        </button>
      </form>
    </div>
  );
}

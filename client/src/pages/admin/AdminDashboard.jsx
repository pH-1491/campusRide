import { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Car, Users, CheckCircle, XCircle, TrendingUp,
  Activity, MapPin, Clock
} from 'lucide-react';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const StatCard = ({ icon: Icon, label, value, sub, color = 'green' }) => {
  const colors = {
    green:  'bg-brand-500/10 text-brand-400',
    blue:   'bg-blue-500/10 text-blue-400',
    yellow: 'bg-yellow-500/10 text-yellow-400',
    red:    'bg-red-500/10 text-red-400',
    purple: 'bg-purple-500/10 text-purple-400',
  };
  return (
    <div className="card">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-white">{value ?? '—'}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-600 mt-1">{sub}</p>}
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-panel border border-border rounded-lg px-3 py-2 text-xs">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [trend, setTrend] = useState([]);
  const [peakHours, setPeakHours] = useState([]);
  const [locations, setLocations] = useState([]);
  const [driverStats, setDriverStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [ov, tr, ph, loc, ds] = await Promise.all([
          api.get('/analytics/overview'),
          api.get('/analytics/rides-trend'),
          api.get('/analytics/peak-hours'),
          api.get('/analytics/popular-locations'),
          api.get('/analytics/driver-stats'),
        ]);
        setOverview(ov.data.overview);
        setTrend(tr.data.trend);
        setPeakHours(ph.data.peakHours.filter(h => h.rides > 0));
        setLocations(loc.data.locations.slice(0, 6));
        setDriverStats(ds.data.drivers.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  const statusPieData = overview ? [
    { name: 'Completed',  value: overview.completedRides  },
    { name: 'Active',     value: overview.activeRides     },
    { name: 'Cancelled',  value: overview.cancelledRides  },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
        <p className="text-slate-400 mt-1">Platform overview and insights</p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Car}         label="Total Rides"       value={overview?.totalRides}       color="blue"   />
        <StatCard icon={CheckCircle} label="Completed Rides"   value={overview?.completedRides}   color="green"  sub={`${overview?.completionRate}% rate`} />
        <StatCard icon={Users}       label="Passengers"        value={overview?.totalUsers}        color="purple" />
        <StatCard icon={Activity}    label="Online Drivers"    value={`${overview?.onlineDrivers} / ${overview?.totalDrivers}`} color="yellow" />
      </div>

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* 7-day trend */}
        <div className="lg:col-span-2 card">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">Rides – Last 7 Days</h2>
          {trend.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-600 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="rides" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 3 }} name="Rides" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Ride status pie */}
        <div className="card">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">Ride Status</h2>
          {statusPieData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-600 text-sm">No rides yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                  dataKey="value" nameKey="name" paddingAngle={3}>
                  {statusPieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(val) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{val}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Peak hours */}
        <div className="card">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">
            <Clock className="w-4 h-4 inline mr-1.5 text-yellow-400" />Peak Hours
          </h2>
          {peakHours.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-600 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={peakHours}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 10 }} interval={3} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="rides" fill="#f59e0b" radius={[3, 3, 0, 0]} name="Rides" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Popular locations */}
        <div className="card">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">
            <MapPin className="w-4 h-4 inline mr-1.5 text-blue-400" />Popular Locations
          </h2>
          {locations.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-600 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={locations} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="location" tick={{ fill: '#94a3b8', fontSize: 10 }} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 3, 3, 0]} name="Requests" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top drivers table */}
      {driverStats.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">Top Drivers</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Driver', 'Vehicle', 'Total Rides', 'Rating', 'Status'].map(h => (
                    <th key={h} className="text-left text-xs text-slate-500 font-semibold uppercase tracking-wide pb-3 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {driverStats.map((d, i) => (
                  <tr key={d.id}>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-blue-600/20 rounded-full flex items-center justify-center text-blue-400 font-bold text-xs">
                          {d.user?.name?.[0]}
                        </div>
                        <span className="text-white font-medium">{d.user?.name}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-slate-400">{d.vehicleNumber}</td>
                    <td className="py-3 pr-4 text-white font-semibold">{d.totalRides}</td>
                    <td className="py-3 pr-4">
                      <span className="text-yellow-400">★ {d.averageRating?.toFixed(1) || '—'}</span>
                    </td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        d.isOnline ? 'bg-brand-500/20 text-brand-400' : 'bg-slate-700 text-slate-400'
                      }`}>
                        {d.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

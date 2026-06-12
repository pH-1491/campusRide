import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Users, Search, Trash2, Shield, User, Car } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLE_BADGE = {
  PASSENGER: 'bg-brand-500/20 text-brand-400',
  DRIVER:    'bg-blue-500/20 text-blue-400',
  ADMIN:     'bg-purple-500/20 text-purple-400',
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.users);
      setFiltered(res.data.users);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    let result = users;
    if (roleFilter !== 'ALL') result = result.filter(u => u.role === roleFilter);
    if (search) result = result.filter(u =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [search, roleFilter, users]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(prev => prev.filter(u => u.id !== id));
      toast.success('User deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  const counts = {
    ALL: users.length,
    PASSENGER: users.filter(u => u.role === 'PASSENGER').length,
    DRIVER: users.filter(u => u.role === 'DRIVER').length,
    ADMIN: users.filter(u => u.role === 'ADMIN').length,
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="text-slate-400 mt-1">Manage registered users</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <div className="flex gap-2">
          {['ALL', 'PASSENGER', 'DRIVER', 'ADMIN'].map(role => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                roleFilter === role
                  ? 'bg-brand-600/20 text-brand-400 border-brand-500/50'
                  : 'bg-panel text-slate-400 border-border hover:border-slate-500'
              }`}
            >
              {role} <span className="ml-1 opacity-60">({counts[role]})</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['User', 'Email', 'Phone', 'Role', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs text-slate-500 font-semibold uppercase tracking-wide p-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500">No users found</td>
                  </tr>
                ) : filtered.map(user => (
                  <tr key={user.id} className="hover:bg-white/2 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          user.role === 'ADMIN' ? 'bg-purple-600/20 text-purple-400'
                          : user.role === 'DRIVER' ? 'bg-blue-600/20 text-blue-400'
                          : 'bg-brand-600/20 text-brand-400'
                        }`}>
                          {user.name[0]}
                        </div>
                        <span className="font-medium text-white">{user.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-400">{user.email}</td>
                    <td className="p-4 text-slate-400">{user.phone || '—'}</td>
                    <td className="p-4">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${ROLE_BADGE[user.role]}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 text-xs">{formatDate(user.createdAt)}</td>
                    <td className="p-4">
                      {user.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleDelete(user.id, user.name)}
                          className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
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

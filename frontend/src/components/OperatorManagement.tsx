'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function OperatorManagement() {
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchOperators = async () => {
    try {
      const res = await api.get('/auth/operators');
      setOperators(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperators();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/auth/operators', formData);
      setSuccess('Operator created successfully!');
      setFormData({ name: '', email: '', password: '' });
      fetchOperators();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create operator');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this operator?')) return;
    try {
      await api.delete(`/auth/operators/${id}`);
      fetchOperators();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete operator');
    }
  };

  const inputClass = 'w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm';
  const labelClass = 'block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1';

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4">Add Operator</h3>
        <form onSubmit={handleCreate} className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
          {error && <div className="text-xs text-red-600 bg-red-50 p-2 rounded">{error}</div>}
          {success && <div className="text-xs text-emerald-600 bg-emerald-50 p-2 rounded">{success}</div>}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Name</label>
              <input required className={inputClass} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input required type="email" className={inputClass} value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Password</label>
            <input required type="password" minLength={6} className={inputClass} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
          </div>
          <button type="submit" disabled={operators.length >= 3} className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-bold disabled:opacity-50">
            {operators.length >= 3 ? 'Limit Reached (3/3)' : 'Create Operator'}
          </button>
        </form>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-800">Current Operators</h3>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">{operators.length} / 3</span>
        </div>
        
        {loading ? (
          <p className="text-sm text-slate-400 italic">Loading operators...</p>
        ) : operators.length === 0 ? (
          <p className="text-sm text-slate-400 italic bg-slate-50 p-4 rounded-xl text-center border border-slate-100">No operators added yet.</p>
        ) : (
          <div className="space-y-3">
            {operators.map((op: any) => (
              <div key={op.id} className="flex justify-between items-center p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                <div>
                  <p className="font-bold text-slate-800">{op.name}</p>
                  <p className="text-xs text-slate-500">{op.email}</p>
                </div>
                <button onClick={() => handleDelete(op.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all text-sm font-semibold">
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

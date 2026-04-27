'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function ProfileModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    designationType: '',
    houseType: '',
    constituency: '',
    state: '',
    defaultAddress: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        designationType: user.designationType || '',
        houseType: user.houseType || '',
        constituency: user.constituency || '',
        state: user.state || '',
        defaultAddress: user.defaultAddress || '',
      });
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await updateProfile(formData);
      setSuccess('Profile updated successfully!');
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm';
  const labelClass = 'block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white p-6 border-b z-10 flex justify-between items-center rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Profile Settings</h2>
            <p className="text-xs text-slate-400 mt-1">These details will appear on your official letters</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">{error}</div>}
          {success && <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg text-sm border border-emerald-100">{success}</div>}

          <div>
            <label className={labelClass}>Full Name</label>
            <input required className={inputClass} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Pratyusha Rajeshwari Singh" />
          </div>

          <div>
            <label className={labelClass}>Email</label>
            <input type="email" className={inputClass} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="e.g. mp@gov.in" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Designation Type</label>
              <select className={inputClass} value={formData.designationType} onChange={(e) => setFormData({ ...formData, designationType: e.target.value })}>
                <option value="">Select...</option>
                <option value="Member of Parliament">Member of Parliament</option>
                <option value="Member of Legislative Assembly">Member of Legislative Assembly</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>House Type</label>
              <select className={inputClass} value={formData.houseType} onChange={(e) => setFormData({ ...formData, houseType: e.target.value })}>
                <option value="">Select...</option>
                <option value="Lok Sabha">Lok Sabha</option>
                <option value="Rajya Sabha">Rajya Sabha</option>
                <option value="State Assembly">State Assembly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Constituency</label>
              <input className={inputClass} value={formData.constituency} onChange={(e) => setFormData({ ...formData, constituency: e.target.value })} placeholder="e.g. Kandhamal" />
            </div>
            <div>
              <label className={labelClass}>State</label>
              <input className={inputClass} value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} placeholder="e.g. Odisha" />
            </div>
          </div>

          <div>
            <label className={labelClass}>Default Address (for letterhead)</label>
            <textarea rows={3} className={inputClass} value={formData.defaultAddress} onChange={(e) => setFormData({ ...formData, defaultAddress: e.target.value })} placeholder={"D-6, Block-A, M.S. Flats 'Sindhu'\nBaba Kharak Singh Marg\nNew Delhi-110001"} />
            <p className="text-xs text-slate-400 mt-1">This will appear on the right side of your letter header.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-semibold text-sm">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-semibold text-sm disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

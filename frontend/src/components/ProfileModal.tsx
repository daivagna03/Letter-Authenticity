'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import OperatorManagement from './OperatorManagement';

export default function ProfileModal({ isOpen, onClose, onProfileUpdate }: { isOpen: boolean; onClose: () => void; onProfileUpdate?: () => void }) {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'operators'>('profile');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    designation: '',
    department: '',
    organization: '',
    defaultAddress: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        designation: user.designation || '',
        department: user.department || '',
        organization: user.organization || '',
        defaultAddress: user.defaultAddress || '',
      });
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await updateProfile(formData);
      onClose();
      if (onProfileUpdate) {
        onProfileUpdate();
      }
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
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="bg-white p-6 border-b z-10 flex justify-between items-center rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Settings</h2>
            <p className="text-xs text-slate-400 mt-1">Manage your account and preferences</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {user?.role === 'PRIMARY' && (
          <div className="px-6 pt-4 border-b border-slate-100 flex gap-4">
            <button 
              onClick={() => setActiveTab('profile')}
              className={`pb-3 text-sm font-semibold border-b-2 transition-all ${activeTab === 'profile' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Profile
            </button>
            <button 
              onClick={() => setActiveTab('operators')}
              className={`pb-3 text-sm font-semibold border-b-2 transition-all ${activeTab === 'operators' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Operator Management
            </button>
          </div>
        )}

        <div className="overflow-y-auto p-6">
          {activeTab === 'profile' ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">{error}</div>}

              <div>
                <label className={labelClass}>Full Name</label>
                <input required className={inputClass} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. John Doe" />
              </div>

              <div>
                <label className={labelClass}>Email</label>
                <input type="email" className={inputClass} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="e.g. user@organization.com" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Designation</label>
                  <input className={inputClass} value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} placeholder="e.g. General Manager" />
                </div>
                <div>
                  <label className={labelClass}>Department</label>
                  <input className={inputClass} value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} placeholder="e.g. Operations" />
                </div>
              </div>

              <div>
                <label className={labelClass}>Organization / Company</label>
                <input className={inputClass} value={formData.organization} onChange={(e) => setFormData({ ...formData, organization: e.target.value })} placeholder="e.g. Acme Corp" />
              </div>

              <div>
                <label className={labelClass}>Default Address (for letterhead)</label>
                <textarea rows={3} className={inputClass} value={formData.defaultAddress} onChange={(e) => setFormData({ ...formData, defaultAddress: e.target.value })} placeholder={"123 Business Rd\nTech Park\nCity-100001"} />
                <p className="text-xs text-slate-400 mt-1">This will appear on the right side of your letter header.</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={onClose} className="flex-1 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-semibold text-sm">
                  Close
                </button>
                <button type="submit" disabled={loading} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-semibold text-sm disabled:opacity-50">
                  {loading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          ) : (
            <OperatorManagement />
          )}
        </div>
      </div>
    </div>
  );
}

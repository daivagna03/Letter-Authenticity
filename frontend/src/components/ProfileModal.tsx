'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

type TabType = 'profile' | 'political' | 'operators';

export default function ProfileModal({ isOpen, onClose, onProfileUpdate }: { isOpen: boolean; onClose: () => void; onProfileUpdate?: () => void }) {
  const { user, updateProfile } = useAuth();
  const isPolitical = user?.mode === 'POLITICAL';
  const isMainUser = user?.role === 'MAIN_USER';
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  const [profileForm, setProfileForm] = useState({
    name: '', email: '', designation: '', department: '', organization: '', defaultAddress: '',
    constituency: '', state: '', houseType: '', signatureUrl: '', sealUrl: '',
  });
  const [operatorForm, setOperatorForm] = useState({ name: '', email: '', password: '', operatorRole: '' });
  const [operators, setOperators] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [opLoading, setOpLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user && isOpen) {
      setProfileForm({
        name: user.name || '', email: user.email || '',
        designation: user.designation || '', department: user.department || '',
        organization: user.organization || '', defaultAddress: user.defaultAddress || '',
        constituency: user.constituency || '', state: user.state || '',
        houseType: user.houseType || '', signatureUrl: user.signatureUrl || '', sealUrl: user.sealUrl || '',
      });
      if (isMainUser) fetchOperators();
    }
  }, [user, isOpen]);

  const fetchOperators = async () => {
    try { const r = await api.get('/auth/operators'); setOperators(r.data); } catch (_) {}
  };

  if (!isOpen) return null;

  const handleSaveProfile = async () => {
    setLoading(true); setError(''); setSuccess('');
    try {
      await updateProfile(profileForm);
      setSuccess('Saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
      if (onProfileUpdate) onProfileUpdate();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally { setLoading(false); }
  };

  const handleCreateOperator = async (e: React.FormEvent) => {
    e.preventDefault(); setOpLoading(true); setError(''); setSuccess('');
    try {
      await api.post('/auth/operators', operatorForm);
      setSuccess('Operator created!');
      setOperatorForm({ name: '', email: '', password: '', operatorRole: '' });
      fetchOperators();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create operator');
    } finally { setOpLoading(false); }
  };

  const handleToggle = async (id: string) => {
    try { await api.patch(`/auth/operators/${id}/status`); fetchOperators(); } catch (err: any) { alert(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this operator?')) return;
    try { await api.delete(`/auth/operators/${id}`); fetchOperators(); } catch (err: any) { alert(err.response?.data?.message || 'Failed'); }
  };

  const ic = 'w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm';
  const lc = 'block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5';

  const tabs: { key: TabType; label: string }[] = [
    { key: 'profile', label: isPolitical ? 'Political Profile' : 'Profile' },
    ...(isMainUser ? [{ key: 'operators' as TabType, label: 'Operators' }] : []),
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Settings</h2>
            <p className="text-xs text-slate-400 mt-1">
              {isPolitical ? '🟣 Political Mode' : '🟢 Organization Mode'} · {isMainUser ? 'Main User' : 'Operator'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-6 pt-4 border-b flex gap-4">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-semibold border-b-2 transition-all ${activeTab === tab.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto p-6 space-y-5">
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">{error}</div>}
          {success && <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg text-sm border border-emerald-100">{success}</div>}

          {activeTab === 'profile' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={lc}>Full Name</label><input className={ic} value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} /></div>
                <div><label className={lc}>Email</label><input type="email" className={ic} value={profileForm.email} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} /></div>
              </div>

              {!isPolitical && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className={lc}>Designation</label><input className={ic} value={profileForm.designation} onChange={e => setProfileForm({ ...profileForm, designation: e.target.value })} /></div>
                    <div><label className={lc}>Department</label><input className={ic} value={profileForm.department} onChange={e => setProfileForm({ ...profileForm, department: e.target.value })} /></div>
                  </div>
                  <div><label className={lc}>Organization</label><input className={ic} value={profileForm.organization} onChange={e => setProfileForm({ ...profileForm, organization: e.target.value })} /></div>
                  <div><label className={lc}>Default Address (letterhead)</label><textarea rows={3} className={ic} value={profileForm.defaultAddress} onChange={e => setProfileForm({ ...profileForm, defaultAddress: e.target.value })} /></div>
                </>
              )}

              {isPolitical && (
                <>
                  <div>
                    <label className={lc}>House / Designation</label>
                    <select className={ic} value={profileForm.houseType} onChange={e => setProfileForm({ ...profileForm, houseType: e.target.value })}>
                      <option value="">Select...</option>
                      <option value="Lok Sabha">Member of Parliament – Lok Sabha</option>
                      <option value="Rajya Sabha">Member of Parliament – Rajya Sabha</option>
                      <option value="State Assembly">Member of Legislative Assembly (MLA)</option>
                      <option value="State Council">Member of Legislative Council (MLC)</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className={lc}>Constituency</label><input className={ic} value={profileForm.constituency} onChange={e => setProfileForm({ ...profileForm, constituency: e.target.value })} /></div>
                    <div><label className={lc}>State</label><input className={ic} value={profileForm.state} onChange={e => setProfileForm({ ...profileForm, state: e.target.value })} /></div>
                  </div>
                  <div><label className={lc}>Office Address (letterhead)</label><textarea rows={3} className={ic} value={profileForm.defaultAddress} onChange={e => setProfileForm({ ...profileForm, defaultAddress: e.target.value })} /></div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div><label className={lc}>Signature URL</label><input className={ic} value={profileForm.signatureUrl} onChange={e => setProfileForm({ ...profileForm, signatureUrl: e.target.value })} placeholder="https://..." /></div>
                <div><label className={lc}>Seal URL</label><input className={ic} value={profileForm.sealUrl} onChange={e => setProfileForm({ ...profileForm, sealUrl: e.target.value })} placeholder="https://..." /></div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="flex-1 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 font-semibold text-sm">Close</button>
                <button onClick={handleSaveProfile} disabled={loading} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold text-sm disabled:opacity-50">
                  {loading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </>
          )}

          {activeTab === 'operators' && isMainUser && (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-slate-800 mb-3">Add Operator</h3>
                <form onSubmit={handleCreateOperator} className="bg-slate-50 p-4 rounded-xl border space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={lc}>Name</label><input required className={ic} value={operatorForm.name} onChange={e => setOperatorForm({ ...operatorForm, name: e.target.value })} /></div>
                    <div><label className={lc}>Email</label><input required type="email" className={ic} value={operatorForm.email} onChange={e => setOperatorForm({ ...operatorForm, email: e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={lc}>Password</label><input required type="password" minLength={6} className={ic} value={operatorForm.password} onChange={e => setOperatorForm({ ...operatorForm, password: e.target.value })} /></div>
                    <div><label className={lc}>Role Label</label><input className={ic} value={operatorForm.operatorRole} onChange={e => setOperatorForm({ ...operatorForm, operatorRole: e.target.value })} placeholder="e.g. Clerk" /></div>
                  </div>
                  <button type="submit" disabled={opLoading || operators.length >= 3} className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-bold disabled:opacity-50">
                    {operators.length >= 3 ? 'Limit Reached (3/3)' : opLoading ? 'Creating...' : 'Create Operator'}
                  </button>
                </form>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-slate-800">Current Operators</h3>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">{operators.length} / 3</span>
                </div>
                {operators.length === 0 ? (
                  <p className="text-sm text-slate-400 italic text-center p-4 bg-slate-50 rounded-xl border">No operators added yet.</p>
                ) : (
                  <div className="space-y-2">
                    {operators.map((op: any) => (
                      <div key={op.id} className={`flex justify-between items-center p-3 bg-white border rounded-xl shadow-sm ${!op.isActive ? 'border-red-200 opacity-70' : 'border-slate-200'}`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${op.isActive ? 'bg-emerald-500' : 'bg-red-400'}`} />
                          <div>
                            <p className="font-bold text-sm text-slate-800">{op.name}</p>
                            <p className="text-xs text-slate-500">{op.email}</p>
                          </div>
                          {op.operatorRole && <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase">{op.operatorRole}</span>}
                          {!op.isActive && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase">Disabled</span>}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleToggle(op.id)} className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${op.isActive ? 'text-amber-600 border-amber-200 hover:bg-amber-50' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'}`}>
                            {op.isActive ? 'Disable' : 'Enable'}
                          </button>
                          <button onClick={() => handleDelete(op.id)} className="text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 transition-all">Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

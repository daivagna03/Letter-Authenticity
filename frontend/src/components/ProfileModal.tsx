'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import OperatorManagement from './OperatorManagement';

type TabType = 'profile' | 'assistant' | 'principal' | 'operators';

export default function ProfileModal({ isOpen, onClose, onProfileUpdate }: { isOpen: boolean; onClose: () => void; onProfileUpdate?: () => void }) {
  const { user, updateProfile, updateAssistantDetails, updatePrincipalDetails } = useAuth();
  const isAssistant = user?.accountType === 'ASSISTANT';
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  const [profileForm, setProfileForm] = useState({
    name: '', email: '', designation: '', department: '', organization: '', defaultAddress: '',
  });
  const [assistantForm, setAssistantForm] = useState({
    assistantName: '', assistantRole: '', assistantContact: '',
  });
  const [principalForm, setPrincipalForm] = useState({
    principalName: '', principalDesignation: '', principalOrganization: '', principalAddress: '',
    principalSignatureUrl: '', principalSealUrl: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '', email: user.email || '',
        designation: user.designation || '', department: user.department || '',
        organization: user.organization || '', defaultAddress: user.defaultAddress || '',
      });
      setAssistantForm({
        assistantName: user.assistantName || '', assistantRole: user.assistantRole || '',
        assistantContact: user.assistantContact || '',
      });
      setPrincipalForm({
        principalName: user.principalName || '', principalDesignation: user.principalDesignation || '',
        principalOrganization: user.principalOrganization || '', principalAddress: user.principalAddress || '',
        principalSignatureUrl: user.principalSignatureUrl || '', principalSealUrl: user.principalSealUrl || '',
      });
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (type: 'profile' | 'assistant' | 'principal') => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (type === 'profile') await updateProfile(profileForm);
      else if (type === 'assistant') await updateAssistantDetails(assistantForm);
      else await updatePrincipalDetails(principalForm);
      setSuccess('Saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
      if (onProfileUpdate) onProfileUpdate();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm';
  const labelClass = 'block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5';

  const tabs: { key: TabType; label: string }[] = [
    { key: 'profile', label: 'Profile' },
    ...(isAssistant ? [
      { key: 'assistant' as TabType, label: 'Assistant Details' },
      { key: 'principal' as TabType, label: 'Principal Details' },
    ] : []),
    ...(user?.role === 'PRIMARY' ? [{ key: 'operators' as TabType, label: 'Operators' }] : []),
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="bg-white p-6 border-b z-10 flex justify-between items-center rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Settings</h2>
            <p className="text-xs text-slate-400 mt-1">
              {isAssistant ? 'Manage assistant & principal profiles' : 'Manage your account and preferences'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Tab Navigation */}
        {tabs.length > 1 && (
          <div className="px-6 pt-4 border-b border-slate-100 flex gap-4 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`pb-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        <div className="overflow-y-auto p-6">
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 mb-4">{error}</div>}
          {success && <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg text-sm border border-emerald-100 mb-4">{success}</div>}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-5">
              <div>
                <label className={labelClass}>Full Name</label>
                <input required className={inputClass} value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input type="email" className={inputClass} value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} />
              </div>
              {!isAssistant && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Designation</label>
                      <input className={inputClass} value={profileForm.designation} onChange={(e) => setProfileForm({ ...profileForm, designation: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>Department</label>
                      <input className={inputClass} value={profileForm.department} onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Organization / Company</label>
                    <input className={inputClass} value={profileForm.organization} onChange={(e) => setProfileForm({ ...profileForm, organization: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>Default Address (for letterhead)</label>
                    <textarea rows={3} className={inputClass} value={profileForm.defaultAddress} onChange={(e) => setProfileForm({ ...profileForm, defaultAddress: e.target.value })} />
                    <p className="text-xs text-slate-400 mt-1">This will appear on the right side of your letter header.</p>
                  </div>
                </>
              )}
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={onClose} className="flex-1 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-semibold text-sm">Close</button>
                <button onClick={() => handleSave('profile')} disabled={loading} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-semibold text-sm disabled:opacity-50">
                  {loading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>
          )}

          {/* Assistant Details Tab */}
          {activeTab === 'assistant' && (
            <div className="space-y-5">
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <p className="text-xs text-indigo-700 font-medium">Your identity as the person operating this system. This is stored for audit/security purposes and is not visible on the letter.</p>
              </div>
              <div>
                <label className={labelClass}>Assistant Name</label>
                <input className={inputClass} value={assistantForm.assistantName} onChange={(e) => setAssistantForm({ ...assistantForm, assistantName: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Role / Title</label>
                  <input className={inputClass} value={assistantForm.assistantRole} onChange={(e) => setAssistantForm({ ...assistantForm, assistantRole: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>Contact Info</label>
                  <input className={inputClass} value={assistantForm.assistantContact} onChange={(e) => setAssistantForm({ ...assistantForm, assistantContact: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={onClose} className="flex-1 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-semibold text-sm">Close</button>
                <button onClick={() => handleSave('assistant')} disabled={loading} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-semibold text-sm disabled:opacity-50">
                  {loading ? 'Saving...' : 'Save Assistant Details'}
                </button>
              </div>
            </div>
          )}

          {/* Principal Details Tab */}
          {activeTab === 'principal' && (
            <div className="space-y-5">
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                <p className="text-xs text-amber-700 font-medium">The authority on whose behalf you write letters. These details will appear on the letterhead, signature block, and official documents.</p>
              </div>
              <div>
                <label className={labelClass}>Principal Name</label>
                <input className={inputClass} value={principalForm.principalName} onChange={(e) => setPrincipalForm({ ...principalForm, principalName: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Designation</label>
                <input className={inputClass} value={principalForm.principalDesignation} onChange={(e) => setPrincipalForm({ ...principalForm, principalDesignation: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Organization</label>
                <input className={inputClass} value={principalForm.principalOrganization} onChange={(e) => setPrincipalForm({ ...principalForm, principalOrganization: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Address</label>
                <textarea rows={3} className={inputClass} value={principalForm.principalAddress} onChange={(e) => setPrincipalForm({ ...principalForm, principalAddress: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Signature URL</label>
                  <input className={inputClass} value={principalForm.principalSignatureUrl} onChange={(e) => setPrincipalForm({ ...principalForm, principalSignatureUrl: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>Seal URL</label>
                  <input className={inputClass} value={principalForm.principalSealUrl} onChange={(e) => setPrincipalForm({ ...principalForm, principalSealUrl: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={onClose} className="flex-1 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-semibold text-sm">Close</button>
                <button onClick={() => handleSave('principal')} disabled={loading} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-semibold text-sm disabled:opacity-50">
                  {loading ? 'Saving...' : 'Save Principal Details'}
                </button>
              </div>
            </div>
          )}

          {/* Operators Tab */}
          {activeTab === 'operators' && <OperatorManagement />}
        </div>
      </div>
    </div>
  );
}

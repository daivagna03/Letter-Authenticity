'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

type Mode = 'ORGANIZATION' | 'POLITICAL';

export default function RegisterPage() {
  const [mode, setMode] = useState<Mode>('ORGANIZATION');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    employeeId: '',
    password: '',
    confirmPassword: '',
    // Organization mode fields
    designation: '',
    department: '',
    organization: '',
    defaultAddress: '',
    // Political mode fields
    constituency: '',
    state: '',
    houseType: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        employeeId: mode === 'ORGANIZATION' ? (formData.employeeId || undefined) : undefined,
        mode,
      };

      if (mode === 'ORGANIZATION') {
        payload.designation = formData.designation || undefined;
        payload.department = formData.department || undefined;
        payload.organization = formData.organization || undefined;
        payload.defaultAddress = formData.defaultAddress || undefined;
      } else {
        payload.designation = formData.houseType
          ? `${formData.houseType === 'Lok Sabha' || formData.houseType === 'Rajya Sabha' ? 'Member of Parliament' : 'Member of Legislative Assembly'}`
          : 'MLA/MP';
        payload.constituency = formData.constituency || undefined;
        payload.state = formData.state || undefined;
        payload.houseType = formData.houseType || undefined;
      }

      await register(payload);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-sm";
  const labelClass = "block text-sm font-medium text-slate-700 mb-1.5";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 py-12 px-4">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 mb-4 backdrop-blur-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">DocVerify</h1>
          <p className="text-slate-400 mt-1 font-medium">Official Document Authenticity Portal</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Mode Selector */}
          <div className="mb-7">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Select Account Mode</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('ORGANIZATION')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  mode === 'ORGANIZATION'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                <span className="text-2xl">🟢</span>
                <div>
                  <div className="font-bold text-sm">Organization</div>
                  <div className="text-xs opacity-75">General / Office letters</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setMode('POLITICAL')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  mode === 'POLITICAL'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                <span className="text-2xl">🟣</span>
                <div>
                  <div className="font-bold text-sm">Political (MLA/MP)</div>
                  <div className="text-xs opacity-75">Political correspondence</div>
                </div>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">
                {error}
              </div>
            )}

            {/* Common Fields */}
            <div>
              <label className={labelClass}>Full Name *</label>
              <input
                type="text" required className={inputClass}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Mode-specific Email/ID row */}
            {mode === 'ORGANIZATION' ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Official Email *</label>
                  <input type="email" required className={inputClass} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>Employee ID</label>
                  <input type="text" className={inputClass} value={formData.employeeId} onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })} />
                </div>
              </div>
            ) : (
              <div>
                <label className={labelClass}>Official Email *</label>
                <input type="email" required className={inputClass} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
            )}

            {/* Organization Mode Fields */}
            {mode === 'ORGANIZATION' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Designation</label>
                    <input type="text" className={inputClass} value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>Department</label>
                    <input type="text" className={inputClass} value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Organization</label>
                  <input type="text" className={inputClass} value={formData.organization} onChange={(e) => setFormData({ ...formData, organization: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>Office Address (for letterhead)</label>
                  <textarea rows={2} className={inputClass} value={formData.defaultAddress} onChange={(e) => setFormData({ ...formData, defaultAddress: e.target.value })} />
                </div>
              </>
            )}

            {/* Political Mode Fields */}
            {mode === 'POLITICAL' && (
              <>
                <div>
                  <label className={labelClass}>House / Designation *</label>
                  <select
                    required
                    className={inputClass}
                    value={formData.houseType}
                    onChange={(e) => setFormData({ ...formData, houseType: e.target.value })}
                  >
                    <option value="">Select designation...</option>
                    <option value="Lok Sabha">Member of Parliament – Lok Sabha</option>
                    <option value="Rajya Sabha">Member of Parliament – Rajya Sabha</option>
                    <option value="State Assembly">Member of Legislative Assembly (MLA)</option>
                    <option value="State Council">Member of Legislative Council (MLC)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Constituency *</label>
                    <input type="text" required className={inputClass} value={formData.constituency} onChange={(e) => setFormData({ ...formData, constituency: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>State *</label>
                    <input type="text" required className={inputClass} value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Office Address (for letterhead)</label>
                  <textarea rows={2} className={inputClass} value={formData.defaultAddress} onChange={(e) => setFormData({ ...formData, defaultAddress: e.target.value })} />
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Password *</label>
                <input type="password" required className={inputClass} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Confirm Password *</label>
                <input type="password" required className={inputClass} value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 rounded-xl font-bold text-white transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed text-sm"
              style={{
                background: mode === 'POLITICAL'
                  ? 'linear-gradient(135deg, #7c3aed, #4f46e5)'
                  : 'linear-gradient(135deg, #059669, #0284c7)',
              }}
            >
              {isSubmitting ? 'Creating Account...' : `Create ${mode === 'POLITICAL' ? 'Political' : 'Organization'} Account`}
            </button>
          </form>

          <div className="text-center mt-6">
            <p className="text-sm text-slate-500">
              Already have an account?{' '}
              <Link href="/login" className="text-indigo-600 font-semibold hover:text-indigo-700">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

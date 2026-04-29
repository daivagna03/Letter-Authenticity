'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function RegisterPage() {
  const [isAssistant, setIsAssistant] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    employeeId: '',
    password: '',
    confirmPassword: '',
    // Regular account fields
    designation: '',
    department: '',
    organization: '',
    // Assistant account fields
    assistantName: '',
    assistantRole: '',
    assistantContact: '',
    // Principal fields
    principalName: '',
    principalDesignation: '',
    principalOrganization: '',
    principalAddress: '',
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

    if (isAssistant && !formData.assistantName) {
      setError('Assistant name is required for assistant accounts');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        name: isAssistant ? formData.assistantName : formData.name,
        email: formData.email,
        password: formData.password,
        employeeId: formData.employeeId || undefined,
        accountType: isAssistant ? 'ASSISTANT' : 'REGULAR',
        // Regular fields
        designation: formData.designation || undefined,
        department: formData.department || undefined,
        organization: formData.organization || undefined,
        // Assistant fields (only sent if assistant mode)
        ...(isAssistant && {
          assistantName: formData.assistantName,
          assistantRole: formData.assistantRole || undefined,
          assistantContact: formData.assistantContact || undefined,
          principalName: formData.principalName || undefined,
          principalDesignation: formData.principalDesignation || undefined,
          principalOrganization: formData.principalOrganization || undefined,
          principalAddress: formData.principalAddress || undefined,
        }),
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none";
  const labelClass = "block text-sm font-medium text-slate-700 mb-2";
  const sectionTitle = "text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] py-12 px-4">
      <div className="max-w-lg w-full p-8 bg-white rounded-2xl shadow-xl border border-slate-100">
        <div className="text-center mb-8">
          <div className="inline-block p-3 rounded-xl bg-indigo-50 text-indigo-600 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-slate-900">Create Official Account</h2>
          <p className="text-slate-500 mt-2">Register to manage your secure communications</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Account Type Toggle */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={isAssistant}
                  onChange={(e) => setIsAssistant(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 rounded-full peer peer-checked:bg-indigo-600 transition-all"></div>
                <div className="absolute left-[2px] top-[2px] w-5 h-5 bg-white rounded-full transition-all peer-checked:translate-x-5 shadow-sm"></div>
              </div>
              <div>
                <span className="text-sm font-bold text-slate-800">Assistant Account</span>
                <p className="text-xs text-slate-500">Create letters on behalf of a principal/authority</p>
              </div>
            </label>
          </div>
          
          {/* Basic Info */}
          {!isAssistant && (
            <div>
              <label className={labelClass}>Full Name</label>
              <input
                type="text"
                required
                className={inputClass}
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
          )}

          <div>
            <label className={labelClass}>Official Email</label>
            <input
              type="email"
              required
              className={inputClass}
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div>
            <label className={labelClass}>Employee ID (Unique)</label>
            <input
              type="text"
              className={inputClass}
              value={formData.employeeId}
              onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
            />
          </div>

          {/* Regular Account Fields */}
          {!isAssistant && (
            <>
              <div>
                <label className={labelClass}>Designation</label>
                <input
                  type="text"
                  className={inputClass}
                  value={formData.designation}
                  onChange={(e) => setFormData({...formData, designation: e.target.value})}
                />
              </div>

              <div>
                <label className={labelClass}>Department</label>
                <input
                  type="text"
                  className={inputClass}
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                />
              </div>

              <div>
                <label className={labelClass}>Organization</label>
                <input
                  type="text"
                  className={inputClass}
                  value={formData.organization}
                  onChange={(e) => setFormData({...formData, organization: e.target.value})}
                />
              </div>
            </>
          )}

          {/* Assistant Account Fields */}
          {isAssistant && (
            <>
              {/* Assistant Identity */}
              <div className="pt-2">
                <h3 className={sectionTitle}>
                  <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">A</span>
                  Assistant Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Assistant Name *</label>
                    <input
                      type="text"
                      required
                      className={inputClass}
                      value={formData.assistantName}
                      onChange={(e) => setFormData({...formData, assistantName: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Role</label>
                      <input
                        type="text"
                        className={inputClass}
                        value={formData.assistantRole}
                        onChange={(e) => setFormData({...formData, assistantRole: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Contact</label>
                      <input
                        type="text"
                        className={inputClass}
                        value={formData.assistantContact}
                        onChange={(e) => setFormData({...formData, assistantContact: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Principal Identity */}
              <div className="pt-2">
                <h3 className={sectionTitle}>
                  <span className="w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold">P</span>
                  Principal Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Principal Name</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={formData.principalName}
                      onChange={(e) => setFormData({...formData, principalName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Designation</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={formData.principalDesignation}
                      onChange={(e) => setFormData({...formData, principalDesignation: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Organization</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={formData.principalOrganization}
                      onChange={(e) => setFormData({...formData, principalOrganization: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Address</label>
                    <textarea
                      rows={2}
                      className={inputClass}
                      value={formData.principalAddress}
                      onChange={(e) => setFormData({...formData, principalAddress: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <div>
            <label className={labelClass}>Password</label>
            <input
              type="password"
              required
              className={inputClass}
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <div>
            <label className={labelClass}>Confirm Password</label>
            <input
              type="password"
              required
              className={inputClass}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-slate-900 text-white font-semibold py-3 rounded-lg hover:bg-slate-800 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="text-center mt-8">
          <p className="text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-600 font-semibold hover:text-indigo-700">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

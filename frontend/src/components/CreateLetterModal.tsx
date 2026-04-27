'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import LetterRenderer from './LetterRenderer';

export default function CreateLetterModal({ isOpen, onClose, onSuccess }: any) {
  const { user } = useAuth();
  const [formData, setFormData] = useState(() => ({
    refNo: `MLA/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toISOString().split('T')[0],
    recipientName: '',
    recipientDesignation: '',
    recipientAddressDetail: '',
    subject: '',
    body: '',
    signatureBlock: 'Member of Legislative Assembly',
    copyTo: ''
  }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const submissionData = {
        ...formData,
        recipientAddress: formData.recipientAddressDetail 
          ? `${formData.recipientDesignation}\n${formData.recipientAddressDetail}`
          : formData.recipientDesignation
      };
      await api.post('/letters', submissionData);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create letter');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-7xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b shrink-0">
          <h2 className="text-2xl font-bold text-slate-800">Create Official Letter</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row bg-slate-50">
          
          {/* Form Section */}
          <div className="flex-1 p-6 overflow-y-auto border-r bg-white">
            <form id="createLetterForm" onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Reference No</label>
                  <input
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. MLA/2026/001"
                    value={formData.refNo}
                    onChange={(e) => setFormData({...formData, refNo: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Date</label>
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Recipient Name</label>
                <input
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Full Name"
                  value={formData.recipientName}
                  onChange={(e) => setFormData({...formData, recipientName: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Recipient Designation</label>
                <input
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. Collector & District Magistrate"
                  value={formData.recipientDesignation}
                  onChange={(e) => setFormData({...formData, recipientDesignation: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Recipient Address (Optional)</label>
                <textarea
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. Ranga Reddy District, Telangana"
                  value={formData.recipientAddressDetail}
                  onChange={(e) => setFormData({...formData, recipientAddressDetail: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Subject</label>
                <input
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Letter Body</label>
                <textarea
                  required
                  rows={6}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-serif"
                  value={formData.body}
                  onChange={(e) => setFormData({...formData, body: e.target.value})}
                />
              </div>
            </form>
          </div>

          {/* Preview Section */}
          <div className="flex-1 p-6 overflow-y-auto hidden lg:block bg-slate-100 flex items-start justify-center">
            <div className="scale-[0.6] origin-top">
              <LetterRenderer 
                letter={{
                  ...formData, 
                  recipientAddress: formData.recipientAddressDetail 
                    ? `${formData.recipientDesignation}\n${formData.recipientAddressDetail}`
                    : formData.recipientDesignation
                }} 
                user={user as any} 
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t shrink-0 flex gap-4 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="createLetterForm"
            disabled={loading}
            className="flex-1 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-semibold disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Create & Generate PDF'}
          </button>
        </div>

      </div>
    </div>
  );
}

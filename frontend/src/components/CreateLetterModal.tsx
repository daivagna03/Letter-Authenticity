'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import LetterRenderer from './LetterRenderer';

interface MplaadRow {
  priorityNo: string;
  workDescription: string;
  cost: string;
  costUnit: 'Lakh' | 'Crore';
}

interface CreateLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (letter: any) => void;
  templateId?: string;
  templateSlug?: string;
  templateName?: string;
}

export default function CreateLetterModal({
  isOpen, onClose, onSuccess,
  templateId, templateSlug = 'general', templateName = 'General Letter'
}: CreateLetterModalProps) {
  const { user } = useAuth();

  const [formData, setFormData] = useState(() => ({
    refNo: `DOC/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toISOString().split('T')[0],
    recipientName: '',
    recipientDesignation: '',
    recipientAddressDetail: '',
    subject: '',
    body: '',
    signatureBlock: '',
    copyTo: '',
    // District Order specific
    memoNo: '',
    orderCopyItems: [''],
    // District Order header fields
    districtOrgName: '',
    districtDeptName: '',
    districtName: '',
    // MPLAD specific
    mplaadRows: [{ priorityNo: '', workDescription: '', cost: '', costUnit: 'Lakh' as const }] as MplaadRow[],
    mplaadOpeningPara: 'I recommend that the following works may please be scrutinized and sanctioned from the MPLADS fund:',
    mplaadClosingPara: 'The technical, financial and administrative sanction for the above works may be issued after they have been duly scrutinized. The sanctioned works should be undertaken and completed as per the provisions of the MPLADS Guidelines. I may please be kept informed of the sanction and the progress of the works.',
  }));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset form when template changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      refNo: `DOC/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      recipientName: '', recipientDesignation: '', recipientAddressDetail: '',
      subject: '', body: '', signatureBlock: '', copyTo: '',
      memoNo: '', orderCopyItems: [''],
      districtOrgName: '', districtDeptName: '', districtName: '',
      mplaadRows: [{ priorityNo: '', workDescription: '', cost: '', costUnit: 'Lakh' as const }],
    }));
    setError('');
  }, [templateSlug]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload: any = {
        refNo: formData.refNo,
        date: formData.date,
        recipientName: formData.recipientName,
        recipientDesignation: formData.recipientDesignation || undefined,
        recipientAddressDetail: formData.recipientAddressDetail || undefined,
        recipientAddress: [formData.recipientDesignation, formData.recipientAddressDetail].filter(Boolean).join('\n'),
        subject: formData.subject,
        body: formData.body || (templateSlug === 'mplad' ? formData.mplaadOpeningPara : ''),
        signatureBlock: formData.signatureBlock,
        copyTo: formData.copyTo || undefined,
        templateId: templateId || undefined,
      };

      if (templateSlug === 'district-order') {
        payload.memoNo = formData.memoNo || undefined;
        payload.orderCopyList = formData.orderCopyItems.filter(item => item.trim() !== '');
        payload.districtOrgName = formData.districtOrgName || undefined;
        payload.districtDeptName = formData.districtDeptName || undefined;
        payload.districtName = formData.districtName || undefined;
      }

      if (templateSlug === 'mplad') {
        payload.body = formData.mplaadOpeningPara;
        payload.mplaadTableData = formData.mplaadRows
          .filter(r => r.priorityNo || r.workDescription)
          .map(r => ({ ...r, cost: `${r.cost} ${r.costUnit}` }));
        payload.copyTo = formData.copyTo || undefined;
      }

      const res = await api.post('/letters', payload);
      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create letter');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm";
  const labelClass = "block text-xs font-semibold text-slate-500 uppercase mb-1";

  const templateColor = {
    'general': 'bg-emerald-100 text-emerald-700',
    'state-central': 'bg-blue-100 text-blue-700',
    'district-order': 'bg-amber-100 text-amber-700',
    'mplad': 'bg-purple-100 text-purple-700',
  }[templateSlug] || 'bg-slate-100 text-slate-600';

  // ── Shared recipient + date fields ──────────────────────────────────────────
  // ── Form UI Helpers ──

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-7xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-800">Create Letter</h2>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${templateColor}`}>{templateName}</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row bg-slate-50">

          {/* Form */}
          <div className="flex-1 p-6 overflow-y-auto border-r bg-white">
            <form id="createLetterForm" onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

              {/* ── GENERAL / STATE-CENTRAL ── */}
              {(templateSlug === 'general' || templateSlug === 'state-central') && (
                <>
                  {/* Common Recipient & Date Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Reference No</label>
                      <input required className={inputClass} value={formData.refNo} onChange={(e) => setFormData({ ...formData, refNo: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>Date</label>
                      <input type="date" required className={inputClass} value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Recipient Name</label>
                    <input required className={inputClass} value={formData.recipientName} onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>Recipient Designation</label>
                    <input className={inputClass} value={formData.recipientDesignation} onChange={(e) => setFormData({ ...formData, recipientDesignation: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>Recipient Address</label>
                    <textarea rows={2} className={inputClass} value={formData.recipientAddressDetail} onChange={(e) => setFormData({ ...formData, recipientAddressDetail: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>Subject</label>
                    <input required className={inputClass} value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>Letter Body</label>
                    <textarea required rows={7} className={`${inputClass} font-serif`} value={formData.body} onChange={(e) => setFormData({ ...formData, body: e.target.value })} />
                  </div>
                  {templateSlug === 'state-central' && (
                    <div>
                      <label className={labelClass}>Copy to: (optional)</label>
                      <textarea rows={3} className={inputClass} value={formData.copyTo} onChange={(e) => setFormData({ ...formData, copyTo: e.target.value })} placeholder="Enter copy recipients, one per line" />
                    </div>
                  )}
                </>
              )}

              {/* ── DISTRICT ORDER ── */}
              {templateSlug === 'district-order' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Reference No</label>
                      <input required className={inputClass} value={formData.refNo} onChange={(e) => setFormData({ ...formData, refNo: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>Date</label>
                      <input type="date" required className={inputClass} value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Organization Name (Bold Header)</label>
                    <input className={inputClass} value={formData.districtOrgName} onChange={(e) => setFormData({ ...formData, districtOrgName: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>Department / Branch Name</label>
                    <input className={inputClass} value={formData.districtDeptName} onChange={(e) => setFormData({ ...formData, districtDeptName: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>District Name</label>
                    <input className={inputClass} value={formData.districtName} onChange={(e) => setFormData({ ...formData, districtName: e.target.value })} placeholder="e.g. HYDERABAD" />
                  </div>
                  <div>
                    <label className={labelClass}>Memo No.</label>
                    <input className={inputClass} value={formData.memoNo} onChange={(e) => setFormData({ ...formData, memoNo: e.target.value })} />
                  </div>

                  <div>
                    <label className={labelClass}>Order Body</label>
                    <textarea required rows={8} className={`${inputClass} font-serif`} value={formData.body} onChange={(e) => setFormData({ ...formData, body: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>Copy for kind information to: (numbered list)</label>
                    <div className="space-y-2">
                      {formData.orderCopyItems.map((item, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <span className="text-xs text-slate-400 w-5 shrink-0">{idx + 1}.</span>
                          <input
                            className={inputClass}
                            value={item}
                            onChange={(e) => {
                              const updated = [...formData.orderCopyItems];
                              updated[idx] = e.target.value;
                              setFormData({ ...formData, orderCopyItems: updated });
                            }}
                            placeholder={`Recipient ${idx + 1}`}
                          />
                          {formData.orderCopyItems.length > 1 && (
                            <button type="button" onClick={() => setFormData({ ...formData, orderCopyItems: formData.orderCopyItems.filter((_, i) => i !== idx) })} className="text-red-400 hover:text-red-600 text-xs shrink-0">✕</button>
                          )}
                        </div>
                      ))}
                      <button type="button" onClick={() => setFormData({ ...formData, orderCopyItems: [...formData.orderCopyItems, ''] })} className="text-xs text-indigo-600 font-semibold hover:text-indigo-700">+ Add recipient</button>
                    </div>
                  </div>
                </>
              )}

              {/* ── MPLAD LETTER ── */}
              {templateSlug === 'mplad' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Letter Ref No.</label>
                      <input required className={inputClass} value={formData.refNo} onChange={(e) => setFormData({ ...formData, refNo: e.target.value })} placeholder="015/VRC/MPLADS/2026-27" />
                    </div>
                    <div>
                      <label className={labelClass}>Date</label>
                      <input type="date" required className={inputClass} value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>To (Recipient Name &amp; Designation)</label>
                    <input required className={inputClass} value={formData.recipientName} onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>Recipient Address</label>
                    <textarea rows={2} className={inputClass} value={formData.recipientAddressDetail} onChange={(e) => setFormData({ ...formData, recipientAddressDetail: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>Subject</label>
                    <input required className={inputClass} value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>Opening Paragraph</label>
                    <textarea rows={2} className={`${inputClass} font-serif`} value={formData.mplaadOpeningPara} onChange={(e) => setFormData({ ...formData, mplaadOpeningPara: e.target.value })} />
                  </div>

                  {/* MPLAD Works Table */}
                  <div>
                    <label className={labelClass}>Works / Items Table</label>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-100">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-600 border-b w-16">Priority<br/>No.</th>
                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-600 border-b">Name &amp; Nature of Work / Location</th>
                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-600 border-b w-36">Cost &amp; Unit</th>
                            <th className="w-8 border-b"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {formData.mplaadRows.map((row, idx) => (
                            <tr key={idx} className="border-b last:border-0">
                              <td className="px-2 py-1.5">
                                <input className="w-full px-2 py-1 border rounded text-sm outline-none focus:ring-1 focus:ring-indigo-400" value={row.priorityNo} onChange={(e) => { const r = [...formData.mplaadRows]; r[idx] = { ...r[idx], priorityNo: e.target.value }; setFormData({ ...formData, mplaadRows: r }); }} />
                              </td>
                              <td className="px-2 py-1.5">
                                <textarea rows={2} className="w-full px-2 py-1 border rounded text-sm outline-none focus:ring-1 focus:ring-indigo-400 resize-none" value={row.workDescription} onChange={(e) => { const r = [...formData.mplaadRows]; r[idx] = { ...r[idx], workDescription: e.target.value }; setFormData({ ...formData, mplaadRows: r }); }} />
                              </td>
                              <td className="px-2 py-1.5">
                                <div className="flex gap-1">
                                  <input className="w-20 px-2 py-1 border rounded text-sm outline-none focus:ring-1 focus:ring-indigo-400" value={row.cost} onChange={(e) => { const r = [...formData.mplaadRows]; r[idx] = { ...r[idx], cost: e.target.value }; setFormData({ ...formData, mplaadRows: r }); }} />
                                  <select
                                    className="flex-1 px-1 py-1 border rounded text-xs outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
                                    value={row.costUnit}
                                    onChange={(e) => { const r = [...formData.mplaadRows]; r[idx] = { ...r[idx], costUnit: e.target.value as 'Lakh' | 'Crore' }; setFormData({ ...formData, mplaadRows: r }); }}
                                  >
                                    <option value="Lakh">Lakh</option>
                                    <option value="Crore">Crore</option>
                                  </select>
                                </div>
                              </td>
                              <td className="px-1">
                                {formData.mplaadRows.length > 1 && (
                                  <button type="button" onClick={() => setFormData({ ...formData, mplaadRows: formData.mplaadRows.filter((_, i) => i !== idx) })} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="p-2 bg-slate-50 border-t">
                        <button type="button" onClick={() => setFormData({ ...formData, mplaadRows: [...formData.mplaadRows, { priorityNo: '', workDescription: '', cost: '', costUnit: 'Lakh' }] })} className="text-xs text-indigo-600 font-semibold hover:text-indigo-700">+ Add Row</button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Closing Paragraph</label>
                    <textarea rows={3} className={`${inputClass} font-serif`} value={formData.mplaadClosingPara} onChange={(e) => setFormData({ ...formData, mplaadClosingPara: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>Copy to:</label>
                    <textarea rows={2} className={inputClass} value={formData.copyTo} onChange={(e) => setFormData({ ...formData, copyTo: e.target.value })} />
                  </div>
                </>
              )}
            </form>
          </div>

          {/* Preview */}
          <div className="flex-1 p-6 overflow-y-auto hidden lg:flex bg-slate-100 items-start justify-center">
            <div className="scale-[0.55] origin-top">
              <LetterRenderer
                letter={{
                  ...formData,
                  recipientAddress: formData.recipientAddressDetail
                    ? `${formData.recipientDesignation}\n${formData.recipientAddressDetail}`
                    : formData.recipientDesignation,
                  templateSlug,
                  mplaadTableData: formData.mplaadRows,
                  orderCopyList: formData.orderCopyItems.filter(i => i.trim()),
                  districtOrgName: formData.districtOrgName,
                  districtDeptName: formData.districtDeptName,
                  districtName: formData.districtName,
                }}
                user={user as any}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t shrink-0 flex gap-4 bg-white">
          <button type="button" onClick={onClose} className="flex-1 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-semibold text-sm">Cancel</button>
          <button
            type="submit"
            form="createLetterForm"
            disabled={loading}
            className="flex-1 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-semibold text-sm disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Create & Generate PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}

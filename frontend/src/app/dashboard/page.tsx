'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import api from '@/lib/api';
import CreateLetterModal from '@/components/CreateLetterModal';
import ProfileModal from '@/components/ProfileModal';

type ActiveView = 'dashboard' | 'analytics' | 'templates';

interface Template { id: string; name: string; slug: string; mode: string; description: string; }

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { notifications } = useNotifications();
  const [letters, setLetters] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState({ todayCount: 0, yesterdayCount: 0, calendarData: [] });
  const [templates, setTemplates] = useState<Template[]>([]);
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isTemplatePicker, setIsTemplatePicker] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProfileToast, setShowProfileToast] = useState(false);
  const [showAddressReminder, setShowAddressReminder] = useState(false);

  const openNewLetter = () => {
    setSelectedTemplate(null);
    setIsTemplatePicker(true);
  };

  const pickTemplate = (tmpl: Template) => {
    setSelectedTemplate(tmpl);
    setIsTemplatePicker(false);
    setIsModalOpen(true);
  };

  const isPolitical = user?.mode === 'POLITICAL';
  const isMainUser = user?.role === 'MAIN_USER';
  const modeColor = isPolitical ? 'bg-purple-500' : 'bg-emerald-500';
  const modeLabel = isPolitical ? '🟣 Political' : '🟢 Organization';

  const triggerProfileToast = () => { 
    setShowProfileToast(true); 
    setShowAddressReminder(false);
    setTimeout(() => setShowProfileToast(false), 3000); 
  };

  const fetchLetters = async () => {
    try { const r = await api.get('/letters'); setLetters(r.data); } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  const fetchAnalytics = async () => {
    try { const r = await api.get('/letters/analytics'); setAnalytics(r.data); } catch (e) { console.error(e); }
  };
  const fetchTemplates = async () => {
    try { const r = await api.get('/templates'); setTemplates(r.data); } catch (e) { console.error(e); }
  };

  useEffect(() => { 
    fetchLetters(); 
    fetchAnalytics(); 
    fetchTemplates();

    // Show address reminder if missing and user is main user
    if (user && isMainUser && !user.defaultAddress) {
      setTimeout(() => setShowAddressReminder(true), 1500);
    }
  }, [user]);

  const downloadPDF = async (id: string, refNo: string) => {
    try {
      const r = await api.get(`/letters/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a'); a.href = url;
      a.setAttribute('download', `Letter_${refNo.replace(/\//g, '_')}.pdf`);
      document.body.appendChild(a); a.click(); a.remove();
    } catch { alert('Failed to download PDF'); }
  };

  const deleteLetter = async (id: string, refNo: string) => {
    if (!confirm(`Delete letter ${refNo}?`)) return;
    try { await api.delete(`/letters/${id}`); setLetters(l => l.filter(x => x.id !== id)); fetchAnalytics(); } catch { alert('Failed to delete'); }
  };

  // Analytics helpers
  const paddedCalendarData = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    const dateStr = d.toISOString().split('T')[0];
    const existing = analytics.calendarData.find((x: any) => x.date === dateStr);
    return { date: dateStr, count: existing ? (existing as any).count : 0 };
  });
  const maxCount = Math.max(1, ...paddedCalendarData.map(d => d.count));
  
  const navItem = (view: ActiveView, label: string, icon: React.ReactNode) => (
    <button onClick={() => setActiveView(view)}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all w-full text-left ${activeView === view ? 'bg-white/10 text-indigo-300' : 'text-slate-400 hover:bg-white/5 hover:text-indigo-300'}`}>
      {icon}{label}
    </button>
  );

  const templateCardColor = (slug: string) => ({
    'general': 'from-emerald-500 to-teal-600',
    'state-central': 'from-blue-500 to-cyan-600',
    'district-order': 'from-amber-500 to-orange-600',
    'mplad': 'from-purple-500 to-indigo-600',
  }[slug] || 'from-slate-500 to-slate-600');

  const templateIcon = (slug: string) => ({
    'general': '📄', 'state-central': '📋', 'district-order': '⚖️', 'mplad': '🏛️',
  }[slug] || '📄');

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col p-6 fixed h-full z-10 shadow-xl">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center font-bold text-xl">V</div>
          <h1 className="font-bold text-xl tracking-tight">DocVerify</h1>
        </div>

        <nav className="flex-1 space-y-1">
          {navItem('dashboard', 'Dashboard',
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          )}
          {navItem('analytics', 'Analytics',
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          )}
          {navItem('templates', 'Templates',
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>
          )}
          <button onClick={() => setIsProfileOpen(true)}
            className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl text-slate-400 hover:text-indigo-300 font-medium transition-all w-full text-left">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Profile Settings
          </button>
        </nav>

        <div className="pt-6 border-t border-white/10">
          <div className="px-4 mb-4">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Signed in as</p>
            <p className="font-semibold mt-1 truncate">{user?.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${modeColor} text-white`}>{modeLabel}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-slate-300">{isMainUser ? 'Main User' : 'Operator'}</span>
            </div>
          </div>
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-400/10 rounded-xl transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-72 p-10">
        <div className="max-w-6xl mx-auto">

          {/* Address Reminder Overlay */}
          {showAddressReminder && (
            <div className="mb-8 p-6 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-2xl">📍</div>
                <div>
                  <h4 className="font-bold text-amber-900">Office Address Missing</h4>
                  <p className="text-sm text-amber-700">Please set your office address in Profile Settings to appear correctly on letterheads.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowAddressReminder(false)} className="px-4 py-2 text-sm font-semibold text-amber-600 hover:text-amber-800">Dismiss</button>
                <button onClick={() => { setIsProfileOpen(true); setShowAddressReminder(false); }} className="px-5 py-2 bg-amber-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-amber-700 transition-all">Set Address Now</button>
              </div>
            </div>
          )}

          {/* ── DASHBOARD VIEW ── */}
          {activeView === 'dashboard' && (
            <>
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">Communication Dashboard</h2>
                  <p className="text-slate-500 mt-1">Manage and track your official correspondence</p>
                </div>
                <button onClick={openNewLetter}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                  New Letter
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="font-bold text-slate-800">Recent Letters</h3>
                      <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-500">{letters.length} Total</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {loading ? (
                        <div className="p-10 text-center text-slate-400 italic">Loading letters...</div>
                      ) : letters.length === 0 ? (
                        <div className="p-10 text-center text-slate-400 italic">No letters yet. Create your first letter!</div>
                      ) : (
                        letters.map((letter: any) => (
                          <div key={letter.id} className="p-5 hover:bg-slate-50 transition-all flex justify-between items-center group">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{letter.refNo}</span>
                                <span className="text-xs text-slate-400">• {new Date(letter.createdAt).toLocaleDateString()}</span>
                                {letter.template && <span className="text-[10px] font-bold bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">{letter.template.name}</span>}
                                {letter.draftedBy && (
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${letter.draftedBy.id === user?.id ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                    {letter.draftedBy.id === user?.id ? '✓ You' : `By: ${letter.draftedBy.name}`}
                                  </span>
                                )}
                              </div>
                              <h4 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-all">{letter.subject}</h4>
                              <p className="text-sm text-slate-500 truncate max-w-md">To: {letter.recipientName}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right mr-2">
                                <p className="text-xs font-bold text-slate-400 uppercase">Scans</p>
                                <p className="font-bold text-slate-700">{letter._count?.scanLogs || 0}</p>
                              </div>
                              <button onClick={() => downloadPDF(letter.id, letter.refNo)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Download PDF">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                              </button>
                              {(isMainUser || letter.draftedBy?.id === user?.id) && (
                                <button onClick={() => deleteLetter(letter.id, letter.refNo)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Sidebar: Notifications + QR info */}
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                      Real-time Activity
                    </h3>
                    <div className="space-y-3">
                      {notifications.length === 0 ? (
                        <p className="text-sm text-slate-400 italic text-center py-4">No recent activity.</p>
                      ) : (
                        notifications.map((n: any, i: number) => (
                          <div key={i} className={`p-3 rounded-xl border-l-4 ${n.type === 'WARNING' ? 'bg-orange-50 border-orange-400' : 'bg-blue-50 border-blue-400'}`}>
                            <p className={`text-xs font-bold mb-1 ${n.type === 'WARNING' ? 'text-orange-700' : 'text-blue-700'}`}>{n.type === 'WARNING' ? '⚠️ ALERT' : 'ℹ️ INFO'}</p>
                            <p className="text-sm text-slate-800 font-medium">{n.message}</p>
                            <p className="text-[10px] text-slate-400 mt-1 font-mono">{new Date(n.timestamp).toLocaleTimeString()}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── ANALYTICS VIEW ── */}
          {activeView === 'analytics' && (
            <>
              <div className="flex justify-between items-end mb-10">
                <div>
                  <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">System Insights</h2>
                  <p className="text-sm text-slate-500 font-medium">Real-time overview of document generation velocity.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-[#f8fafc] rounded-xl p-8 border border-slate-100 flex flex-col justify-between h-48">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Documents Today</p>
                  <div className="text-6xl font-black text-slate-800 tracking-tighter">{analytics.todayCount}</div>
                </div>
                <div className="bg-[#f8fafc] rounded-xl p-8 border border-slate-100 flex flex-col justify-between h-48">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Documents Yesterday</p>
                  <div className="text-6xl font-black text-slate-800 tracking-tighter">{analytics.yesterdayCount}</div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-8 border border-slate-100">
                <h4 className="font-bold text-slate-800 mb-1">30-Day Activity</h4>
                <p className="text-xs text-slate-400 mb-6">Daily document generation trend</p>
                <div className="flex items-end h-28 gap-[3px]">
                  {paddedCalendarData.map((day: any, i: number) => (
                    <div key={i} className="bg-indigo-400 hover:bg-indigo-600 rounded-t-sm transition-all flex-1 cursor-pointer"
                      style={{ height: `${Math.max(4, (day.count / maxCount) * 100)}%`, opacity: day.count === 0 ? 0.25 : 1 }}
                      title={`${day.date}: ${day.count} documents`} />
                  ))}
                </div>
                <div className="flex justify-between mt-3 text-[10px] text-slate-400 font-bold">
                  <span>30 days ago</span><span>Today</span>
                </div>
              </div>
            </>
          )}

          {/* ── TEMPLATES VIEW ── */}
          {activeView === 'templates' && (
            <>
              <div className="mb-10">
                <h2 className="text-3xl font-bold text-slate-900">Letter Templates</h2>
                <p className="text-slate-500 mt-1">
                  {isPolitical ? '🟣 Showing Political Mode templates' : '🟢 Showing Organization Mode templates'}
                  {' · '}Select a template to create a letter
                </p>
              </div>

              {templates.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <div className="text-5xl mb-4">📭</div>
                  <p className="font-semibold">No templates available for your mode.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                  {templates.map(tmpl => (
                    <div key={tmpl.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all group">
                      <div className={`h-2 w-full bg-gradient-to-r ${templateCardColor(tmpl.slug)}`} />
                      <div className="p-6">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-3xl">{templateIcon(tmpl.slug)}</span>
                          <div>
                            <h3 className="font-bold text-slate-800 text-lg">{tmpl.name}</h3>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{tmpl.mode === 'POLITICAL' ? '🟣 Political' : '🟢 Organization'}</span>
                          </div>
                        </div>
                        <p className="text-sm text-slate-500 leading-relaxed mb-5">{tmpl.description}</p>
                        <button
                          onClick={() => {
                            setSelectedTemplate(tmpl);
                            setActiveView('dashboard');
                            setIsModalOpen(true);
                          }}
                          className={`w-full py-3 rounded-xl font-bold text-white text-sm transition-all bg-gradient-to-r ${templateCardColor(tmpl.slug)} hover:opacity-90 hover:shadow-lg`}
                        >
                          Use This Template →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </main>

      <CreateLetterModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedTemplate(null); }}
        onSuccess={(newLetter: any) => { setLetters(prev => [newLetter, ...prev]); fetchAnalytics(); }}
        templateId={selectedTemplate?.id}
        templateSlug={selectedTemplate?.slug || 'general'}
        templateName={selectedTemplate?.name || 'General Letter'}
      />

      {/* Template Picker Modal */}
      {isTemplatePicker && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Choose a Template</h2>
                <p className="text-sm text-slate-500 mt-0.5">Select the letter format you want to create</p>
              </div>
              <button onClick={() => setIsTemplatePicker(false)} className="text-slate-400 hover:text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              {templates.length === 0 ? (
                <div className="col-span-2 text-center py-10 text-slate-400 italic">No templates available</div>
              ) : (
                templates.map(tmpl => (
                  <button
                    key={tmpl.id}
                    onClick={() => pickTemplate(tmpl)}
                    className="text-left p-5 rounded-xl border-2 border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all group"
                  >
                    <div className={`h-1.5 w-12 rounded-full mb-3 bg-gradient-to-r ${templateCardColor(tmpl.slug)}`} />
                    <div className="text-2xl mb-2">{templateIcon(tmpl.slug)}</div>
                    <div className="font-bold text-slate-800 group-hover:text-indigo-700">{tmpl.name}</div>
                    <div className="text-xs text-slate-500 mt-1 leading-relaxed">{tmpl.description}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} onProfileUpdate={triggerProfileToast} />

      {showProfileToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-semibold">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
          Profile updated successfully!
        </div>
      )}
    </div>
  );
}

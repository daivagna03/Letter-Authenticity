'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import api from '@/lib/api';
import CreateLetterModal from '@/components/CreateLetterModal';
import ProfileModal from '@/components/ProfileModal';

type ActiveView = 'dashboard' | 'analytics';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { notifications } = useNotifications();
  const [letters, setLetters] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState({ todayCount: 0, yesterdayCount: 0, calendarData: [] });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [showProfileToast, setShowProfileToast] = useState(false);

  const triggerProfileToast = () => {
    setShowProfileToast(true);
    setTimeout(() => setShowProfileToast(false), 3000);
  };

  const fetchLetters = async () => {
    try {
      const res = await api.get('/letters');
      setLetters(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/letters/analytics');
      setAnalytics(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLetters();
    fetchAnalytics();
  }, []);

  const downloadPDF = async (letterId: string, refNo: string) => {
    try {
      const res = await api.get(`/letters/${letterId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Letter_${refNo.replace(/\//g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download PDF');
    }
  };

  const deleteLetter = async (id: string, refNo: string) => {
    if (!confirm(`Are you sure you want to delete letter ${refNo}? This action cannot be undone.`)) return;
    try {
      await api.delete(`/letters/${id}`);
      setLetters(letters.filter((l: any) => l.id !== id));
      fetchAnalytics();
    } catch (err) {
      alert('Failed to delete letter');
    }
  };

  // Analytics derived values
  const paddedCalendarData = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const dateStr = d.toISOString().split('T')[0];
    const existing = analytics.calendarData.find((x: any) => x.date === dateStr);
    return { date: dateStr, count: existing ? (existing as any).count : 0 };
  });
  const maxCount = Math.max(1, ...paddedCalendarData.map(d => d.count));

  const diffCount = analytics.todayCount - analytics.yesterdayCount;
  const percentChange = analytics.yesterdayCount > 0
    ? Math.round((diffCount / analytics.yesterdayCount) * 100)
    : (analytics.todayCount > 0 ? 100 : 0);

  const todayDate = new Date();
  const yesterdayDate = new Date(todayDate);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const currentPeriodStr = `${yesterdayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${todayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  const navItem = (view: ActiveView, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => setActiveView(view)}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all w-full text-left ${
        activeView === view
          ? 'bg-white/10 text-indigo-300'
          : 'text-slate-400 hover:bg-white/5 hover:text-indigo-300'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col p-6 fixed h-full z-10 shadow-xl">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center font-bold text-xl">V</div>
          <h1 className="font-bold text-xl tracking-tight">DocVerify</h1>
        </div>

        <nav className="flex-1 space-y-2">
          {navItem('dashboard', 'Dashboard',
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          )}
          {navItem('analytics', 'Analytics',
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          )}
          <button
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl text-slate-400 hover:text-indigo-300 font-medium transition-all w-full text-left"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Profile Settings
          </button>
        </nav>

        <div className="pt-6 border-t border-white/10">
          <div className="px-4 mb-4">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">User Info</p>
            <p className="font-semibold mt-1 truncate">{user?.name}</p>
            <p className="text-sm text-slate-400">{user?.role === 'PRIMARY' ? 'Primary Account' : 'Operator'}</p>
          </div>
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-400/10 rounded-xl transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-72 p-10 relative">
        <div className="max-w-6xl mx-auto">

          {/* ============ DASHBOARD VIEW ============ */}
          {activeView === 'dashboard' && (
            <>
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">Communication Dashboard</h2>
                  <p className="text-slate-500 mt-1">Manage and track your official correspondence</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  New Letter
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  {/* Letters List */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="font-bold text-slate-800">Recent Letters</h3>
                      <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-500">{letters.length} Total</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {loading ? (
                        <div className="p-10 text-center text-slate-400 italic">Loading letters...</div>
                      ) : letters.length === 0 ? (
                        <div className="p-10 text-center text-slate-400 italic">No letters created yet.</div>
                      ) : (
                        letters.map((letter: any) => (
                          <div key={letter.id} className="p-6 hover:bg-slate-50 transition-all flex justify-between items-center group">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{letter.refNo}</span>
                                <span className="text-xs text-slate-400">• {new Date(letter.createdAt).toLocaleDateString()}</span>
                              </div>
                              <h4 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-all">{letter.subject}</h4>
                              <p className="text-sm text-slate-500 truncate max-w-md">To: {letter.recipientName}</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right mr-4">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Scans</p>
                                <p className="font-bold text-slate-700">{letter._count?.scanLogs || 0}</p>
                              </div>
                              <button
                                onClick={() => downloadPDF(letter.id, letter.refNo)}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                title="Download PDF"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => deleteLetter(letter.id, letter.refNo)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete Letter"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Notifications Sidebar */}
                <div className="space-y-8">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                      Real-time Activity
                    </h3>
                    <div className="space-y-4">
                      {notifications.length === 0 ? (
                        <p className="text-sm text-slate-400 italic text-center py-4">No recent activity detected.</p>
                      ) : (
                        notifications.map((notif, i) => (
                          <div key={i} className={`p-4 rounded-xl border-l-4 shadow-sm ${notif.type === 'WARNING' ? 'bg-orange-50 border-orange-400' : 'bg-blue-50 border-blue-400'}`}>
                            <p className={`text-xs font-bold mb-1 ${notif.type === 'WARNING' ? 'text-orange-700' : 'text-blue-700'}`}>
                              {notif.type === 'WARNING' ? '⚠️ SECURITY ALERT' : 'ℹ️ NOTIFICATION'}
                            </p>
                            <p className="text-sm text-slate-800 font-medium leading-snug">{notif.message}</p>
                            <p className="text-[10px] text-slate-400 mt-2 font-mono">{new Date(notif.timestamp).toLocaleTimeString()}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="bg-indigo-900 rounded-2xl p-6 text-white shadow-xl">
                    <h4 className="font-bold mb-2">QR Authentication</h4>
                    <p className="text-xs text-indigo-200 leading-relaxed">
                      Every letter you generate contains a unique cryptographic hash. Scanners can verify the integrity of the content by scanning the embedded QR code.
                    </p>
                    <div className="mt-4 pt-4 border-t border-indigo-800 flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-indigo-400">
                      <span>SHA-256 Enabled</span>
                      <span>JWT Signed</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ============ ANALYTICS VIEW ============ */}
          {activeView === 'analytics' && (
            <>
              {/* Header */}
              <div className="flex justify-between items-end mb-10">
                <div>
                  <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">System Insights</h2>
                  <p className="text-sm text-slate-500 font-medium">Real-time overview of document generation velocity.</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">CURRENT PERIOD</p>
                  <p className="text-sm font-bold text-slate-700">{currentPeriodStr}</p>
                </div>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-[#f8fafc] rounded-xl p-8 border border-slate-100 flex flex-col justify-between h-48">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Documents Created Today</p>
                  <div className="text-6xl font-black text-slate-800 tracking-tighter">
                    {analytics.todayCount}
                  </div>
                  <p className="text-sm font-bold text-slate-500 flex items-center gap-1.5">
                    {percentChange >= 0 ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
                      </svg>
                    )}
                    {percentChange >= 0 ? '+' : ''}{percentChange}% from yesterday
                  </p>
                </div>

                <div className="bg-[#f8fafc] rounded-xl p-8 border border-slate-100 flex flex-col justify-between h-48">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Documents Created Yesterday</p>
                  <div className="text-6xl font-black text-slate-800 tracking-tighter">
                    {analytics.yesterdayCount}
                  </div>
                  <p className="text-sm font-bold text-slate-400 italic">Standard performance window</p>
                </div>
              </div>

              {/* 30-Day Chart */}
              <div className="bg-white rounded-xl p-8 border border-slate-100 mb-8">
                <h4 className="font-bold text-slate-800 mb-1">30-Day Activity</h4>
                <p className="text-xs text-slate-400 mb-6">Daily document generation trend</p>
                <div className="flex items-end h-28 gap-[3px]">
                  {paddedCalendarData.map((day: any, i: number) => (
                    <div
                      key={i}
                      className="bg-indigo-400 hover:bg-indigo-600 rounded-t-sm transition-all flex-1 cursor-pointer"
                      style={{ height: `${Math.max(4, (day.count / maxCount) * 100)}%`, opacity: day.count === 0 ? 0.25 : 1 }}
                      title={`${day.date}: ${day.count} documents`}
                    ></div>
                  ))}
                </div>
                <div className="flex justify-between mt-3 text-[10px] text-slate-400 font-bold">
                  <span>30 days ago</span>
                  <span>Today</span>
                </div>
              </div>

              {/* Recent Generation Logs table */}
              <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800">Recent Generation Logs</h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filter By ↓</span>
                </div>
                <div className="grid grid-cols-12 px-6 py-3 bg-[#f8fafc] text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                  <div className="col-span-4">Document ID</div>
                  <div className="col-span-5">Generation Date</div>
                  <div className="col-span-3 text-right">Status</div>
                </div>
                <div className="divide-y divide-slate-50">
                  {loading ? (
                    <div className="p-8 text-center text-sm text-slate-400 italic">Loading logs...</div>
                  ) : letters.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-400 italic">No documents generated yet.</div>
                  ) : (
                    letters.map((letter: any) => (
                      <div key={letter.id} className="grid grid-cols-12 px-6 py-4 items-center hover:bg-[#f8fafc] transition-colors group relative">
                        <div className="col-span-4 font-bold text-sm text-slate-800">{letter.refNo}</div>
                        <div className="col-span-5 text-sm text-slate-500 font-medium">
                          {new Date(letter.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {' • '}
                          {new Date(letter.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </div>
                        <div className="col-span-3 flex justify-end items-center gap-3">
                          <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest rounded-full">
                            SUCCESS
                          </span>
                          <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                            <button onClick={() => downloadPDF(letter.id, letter.refNo)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all" title="Download PDF">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </button>
                            <button onClick={() => deleteLetter(letter.id, letter.refNo)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all" title="Delete">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {letters.length > 0 && (
                  <div className="px-6 py-4 border-t border-slate-100 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">View Full History Log →</span>
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      </main>

      <CreateLetterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(newLetter: any) => {
          setLetters((prev: any) => [newLetter, ...prev]);
          fetchAnalytics();
        }}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onProfileUpdate={triggerProfileToast}
      />

      {/* Floating toast notification */}
      {showProfileToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce-in text-sm font-semibold">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Profile updated successfully!
        </div>
      )}
    </div>
  );
}

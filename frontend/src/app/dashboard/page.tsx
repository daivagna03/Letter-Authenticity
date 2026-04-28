'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import api from '@/lib/api';
import CreateLetterModal from '@/components/CreateLetterModal';
import ProfileModal from '@/components/ProfileModal';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { notifications } = useNotifications();
  const [letters, setLetters] = useState([]);
  const [analytics, setAnalytics] = useState({ todayCount: 0, yesterdayCount: 0, calendarData: [] });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [loading, setLoading] = useState(true);

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

  // Format dates for display
  const todayDate = new Date();
  const yesterdayDate = new Date(todayDate);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const dateOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  const currentPeriodStr = `${yesterdayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${todayDate.toLocaleDateString('en-US', dateOptions)}`;

  const diffCount = analytics.todayCount - analytics.yesterdayCount;
  const percentChange = analytics.yesterdayCount > 0 
    ? Math.round((diffCount / analytics.yesterdayCount) * 100) 
    : (analytics.todayCount > 0 ? 100 : 0);

  return (
    <div className="min-h-screen bg-white flex text-slate-800 font-sans">
      {/* Sidebar - Light Theme */}
      <aside className="w-64 bg-[#f8fafc] border-r border-slate-200 flex flex-col p-6 fixed h-full z-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-slate-700 rounded flex items-center justify-center text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm11 1H6v8l4-2 4 2V6z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight leading-tight">Project Alpha</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Document Suite</p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full bg-[#334155] hover:bg-slate-800 text-white py-3 rounded-md text-xs font-bold tracking-widest flex items-center justify-center gap-2 mb-10 transition-colors shadow-sm"
        >
          <span>+</span> CREATE NEW
        </button>
        
        <nav className="flex-1 space-y-1">
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 font-bold text-xs tracking-widest transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            HOME
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-900 font-bold text-xs tracking-widest transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            DASHBOARD
          </a>
        </nav>

        <div className="space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-slate-900 rounded-lg text-xs font-bold tracking-widest transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            HELP
          </button>
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-slate-900 rounded-lg text-xs font-bold tracking-widest transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            LOGOUT
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 p-8 relative min-h-screen">
        <div className="max-w-5xl mx-auto">
          
          {/* Top Navigation */}
          <header className="flex justify-between items-center mb-12 border-b border-slate-100 pb-4">
            <div className="flex gap-8 text-sm font-semibold">
              <span className="text-slate-900 font-bold">ArchitectEditor</span>
              <span className="text-slate-500 cursor-pointer hover:text-slate-900 transition-colors">Documents</span>
              <span className="text-slate-500 cursor-pointer hover:text-slate-900 transition-colors">Templates</span>
              <span className="text-slate-900 border-b-2 border-slate-900 pb-4 -mb-[18px] cursor-pointer">Analytics</span>
            </div>
            <div className="flex items-center gap-5 text-slate-500">
              <button className="hover:text-slate-900 transition-colors relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>
              <button onClick={() => setIsProfileOpen(true)} className="hover:text-slate-900 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287-.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
              </button>
              <div className="w-7 h-7 bg-slate-200 rounded-full overflow-hidden flex items-center justify-center cursor-pointer border border-slate-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </header>

          {/* Header Title Section */}
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">System Insights</h2>
              <p className="text-sm text-slate-500 font-medium">Real-time overview of document generation velocity.</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">CURRENT PERIOD</p>
              <p className="text-sm font-bold text-slate-800">{currentPeriodStr}</p>
            </div>
          </div>

          {/* Analytics Cards */}
          <div className="grid grid-cols-2 gap-6 mb-12">
            <div className="bg-[#f8fafc] rounded-xl p-8 border border-slate-100 flex flex-col justify-between h-48">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">DOCUMENTS CREATED TODAY</p>
              <div className="text-6xl font-black text-slate-800 tracking-tighter">
                {analytics.todayCount}
              </div>
              <p className="text-sm font-bold text-slate-600 flex items-center gap-1">
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
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">DOCUMENTS CREATED YESTERDAY</p>
              <div className="text-6xl font-black text-slate-800 tracking-tighter">
                {analytics.yesterdayCount}
              </div>
              <p className="text-sm font-bold text-slate-500 italic">
                Standard performance window
              </p>
            </div>
          </div>

          {/* Table Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900">Recent Generation Logs</h3>
              <button className="text-xs font-bold text-slate-500 flex items-center gap-1 uppercase tracking-widest hover:text-slate-800 transition-colors">
                FILTER BY
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="w-full">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 bg-[#f8fafc] px-6 py-4 rounded-t-xl text-xs font-bold text-slate-500 uppercase tracking-widest border border-slate-100 border-b-0">
                <div className="col-span-4">DOCUMENT ID</div>
                <div className="col-span-5">GENERATION DATE</div>
                <div className="col-span-3 text-right">STATUS</div>
              </div>

              {/* Table Body */}
              <div className="border border-slate-100 rounded-b-xl overflow-hidden divide-y divide-slate-100">
                {loading ? (
                  <div className="p-8 text-center text-sm font-bold text-slate-400">Loading logs...</div>
                ) : letters.length === 0 ? (
                  <div className="p-8 text-center text-sm font-bold text-slate-400">No documents generated yet.</div>
                ) : (
                  letters.map((letter: any) => (
                    <div key={letter.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center bg-white hover:bg-[#f8fafc] transition-colors group relative">
                      <div className="col-span-4 font-bold text-sm text-slate-800">
                        {letter.refNo}
                      </div>
                      <div className="col-span-5 text-sm font-medium text-slate-600">
                        {new Date(letter.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {new Date(letter.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute:'2-digit', hour12: false })}
                      </div>
                      <div className="col-span-3 text-right flex justify-end items-center gap-3">
                        <span className="px-3 py-1 bg-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-widest rounded-full">
                          SUCCESS
                        </span>
                        
                        {/* Hover Actions */}
                        <div className="absolute right-6 opacity-0 group-hover:opacity-100 flex gap-2 transition-opacity bg-[#f8fafc] pl-4">
                          <button 
                            onClick={() => downloadPDF(letter.id, letter.refNo)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all"
                            title="Download PDF"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => deleteLetter(letter.id, letter.refNo)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                            title="Delete Document"
                          >
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
                <div className="mt-4 text-center">
                  <button className="text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-slate-800 transition-colors">
                    VIEW FULL HISTORY LOG →
                  </button>
                </div>
              )}
            </div>
          </div>
          
        </div>

        {/* Floating Badges */}
        <div className="fixed bottom-8 right-8 flex items-center gap-3 z-20">
          <div className="bg-[#f1f5f9] border border-slate-200 px-4 py-2.5 rounded-full flex items-center gap-3 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">LIVE ENGINE</span>
            </div>
            <div className="w-px h-3 bg-slate-300"></div>
            <span className="text-[10px] font-bold text-slate-500 tracking-widest flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              0.4s avg latency
            </span>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-12 h-12 bg-[#334155] hover:bg-slate-800 text-white rounded-xl shadow-lg flex items-center justify-center transition-transform hover:scale-105"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </main>

      <CreateLetterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => { fetchLetters(); fetchAnalytics(); }}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
}

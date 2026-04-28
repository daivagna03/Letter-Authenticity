import { Suspense } from 'react';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

async function getVerificationResult(token: string) {
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/letters/verify/public?token=${encodeURIComponent(token)}`,
      { cache: 'no-store' }
    );
    return await res.json();
  } catch {
    return { status: 'ERROR', message: 'Could not reach verification server.' };
  }
}

async function VerifyContent({ token }: { token: string }) {
  const result = await getVerificationResult(token);
  const isAuthentic = result?.status === 'AUTHENTIC';
  const isError = result?.status === 'ERROR';

  return (
    <div className="max-w-2xl mx-auto my-10 px-4">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-700 mb-1">Document Verification</h1>
        <p className="text-slate-400 text-sm">Official Portal for Secure Communications</p>
      </div>

      <div className={`p-8 rounded-3xl shadow-2xl border-2 mb-8 text-center ${
        isAuthentic ? 'bg-emerald-50 border-emerald-300' :
        isError ? 'bg-yellow-50 border-yellow-300' :
        'bg-red-50 border-red-300'
      }`}>
        <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 text-5xl shadow-lg ${
          isAuthentic ? 'bg-emerald-500 text-white' :
          isError ? 'bg-yellow-500 text-white' :
          'bg-red-500 text-white'
        }`}>
          {isAuthentic ? '✓' : isError ? '!' : '✕'}
        </div>

        <h2 className={`text-3xl font-black mb-3 ${
          isAuthentic ? 'text-emerald-800' :
          isError ? 'text-yellow-800' :
          'text-red-800'
        }`}>
          {isAuthentic ? 'Document is Authentic' :
           isError ? 'Verification Error' :
           'Tampering Detected'}
        </h2>

        <p className={`font-medium text-lg ${
          isAuthentic ? 'text-emerald-600' :
          isError ? 'text-yellow-700' :
          'text-red-600'
        }`}>
          {isAuthentic
            ? 'The cryptographic hash matches the original record. This document is genuine.'
            : result?.message || 'The content of this document may have been altered.'}
        </p>

        <div className={`mt-4 inline-block px-4 py-1 rounded-full text-xs font-bold tracking-widest ${
          isAuthentic ? 'bg-emerald-100 text-emerald-700' :
          isError ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        }`}>
          {isAuthentic ? 'SHA-256 VERIFIED' : isError ? 'UNREACHABLE' : 'HASH MISMATCH'}
        </div>
      </div>

      {result?.letter && (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
            <h3 className="font-bold tracking-widest uppercase text-xs">Official Document Record</h3>
            <span className="text-[10px] bg-white/20 px-2 py-1 rounded font-mono">REF: {result.letter.refNo}</span>
          </div>

          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-8 border-b border-slate-100 pb-6">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sender</p>
                <p className="font-bold text-slate-800">{result.letter.senderName}</p>
                <p className="text-sm text-slate-600 font-semibold">{result.letter.senderDesignation}</p>
                {result.letter.senderDepartment && (
                  <p className="text-xs text-slate-500 mt-0.5">{result.letter.senderDepartment}</p>
                )}
                {result.letter.senderOrganization && (
                  <p className="text-xs text-slate-400 mt-1 font-bold italic">
                    {result.letter.senderOrganization}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date</p>
                <p className="font-bold text-slate-800">
                  {new Date(result.letter.date).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Recipient</p>
              <p className="font-semibold text-slate-800">{result.letter.recipientName}</p>
              <div className="mt-1 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {result.letter.recipientAddress}
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Subject</p>
              <p className="font-bold text-slate-800">{result.letter.subject}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Verification Status</p>
              <p className="font-mono text-[10px] text-slate-500 break-all">
                Digital fingerprint {isAuthentic ? 'matches' : 'does NOT match'} original record.
                Verified: {new Date().toLocaleString()}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 p-5 text-center border-t border-slate-100">
            <p className="text-xs text-slate-400 italic font-medium">
              Secure Document Verification System • End-to-End Encrypted
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token;

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      {!token ? (
        <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-2xl shadow-xl border border-red-100 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Missing Token</h2>
          <p className="text-slate-600">No verification token was found in the URL.</p>
        </div>
      ) : (
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center p-10 mt-20">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-medium">Verifying Authenticity...</p>
          </div>
        }>
          <VerifyContent token={token} />
        </Suspense>
      )}
    </div>
  );
}

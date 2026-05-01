'use client';

import React from 'react';

interface LetterRendererProps {
  letter: {
    refNo?: string;
    date: string;
    recipientName: string;
    recipientAddress: string;
    subject: string;
    body: string;
    copyTo?: string;
    templateSlug?: string;
    memoNo?: string;
    orderCopyList?: string[];
    mplaadTableData?: { priorityNo: string; workDescription: string; cost: string }[];
    mplaadOpeningPara?: string;
    mplaadClosingPara?: string;
    districtOrgName?: string;
    districtDeptName?: string;
  };
  user: {
    name: string; email?: string; mode?: string;
    designation?: string; department?: string; organization?: string; defaultAddress?: string;
    constituency?: string; state?: string; houseType?: string;
    signatureUrl?: string; sealUrl?: string;
    parentUser?: {
      name: string; designation?: string; department?: string; organization?: string; defaultAddress?: string;
      constituency?: string; state?: string; houseType?: string;
      email?: string; signatureUrl?: string; sealUrl?: string;
    };
  } | null;
}

const EMBLEM_URL = 'https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg';

const pageStyle: React.CSSProperties = {
  width: '210mm', minHeight: '297mm', fontFamily: "'Times New Roman', Times, serif",
  color: '#000', padding: '8mm 15mm 20mm 15mm', boxSizing: 'border-box', fontSize: '13px', background: '#fff',
};

export default function LetterRenderer({ letter, user }: LetterRendererProps) {
  const slug = letter.templateSlug || 'general';
  const effectiveUser = user?.parentUser || user;
  const senderName = effectiveUser?.name ? `Shri ${effectiveUser.name}` : 'Shri Member Name';
  const designation = effectiveUser?.designation || '';
  const department = effectiveUser?.department || '';
  const organization = effectiveUser?.organization || '';
  const defaultAddress = effectiveUser?.defaultAddress || '';
  const senderEmail = effectiveUser?.email || '';
  const constituency = effectiveUser?.constituency || '';
  const state = effectiveUser?.state || '';
  const houseType = effectiveUser?.houseType || '';
  const parsedBody = letter.body ? letter.body.split('\n').filter(p => p.trim()) : [];
  const addressLines = defaultAddress ? defaultAddress.split(/[,\n]/).map(s => s.trim()).filter(Boolean) : [];

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '-') : '[Date]';

  // ── SHARED HEADER (General / State-Central) ──
  const StandardHeader = () => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #999', paddingBottom: '10px', marginBottom: '16px' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '3px' }}>{senderName}</div>
        {designation && <div style={{ fontSize: '13px', fontStyle: 'italic', lineHeight: 1.5 }}>{designation}</div>}
        {constituency && <div style={{ fontSize: '13px', lineHeight: 1.5 }}>Constituency: {constituency}</div>}
        {state && <div style={{ fontSize: '13px', lineHeight: 1.5 }}>State: {state}</div>}
        {department && <div style={{ fontSize: '13px', fontStyle: 'italic', lineHeight: 1.5 }}>{department}</div>}
        {organization && <div style={{ fontSize: '13px', fontStyle: 'italic', lineHeight: 1.5 }}>{organization}</div>}
      </div>
      <div style={{ flexShrink: 0, textAlign: 'center', padding: '0 20px' }}>
        <img src={EMBLEM_URL} alt="Emblem" style={{ width: '65px', height: 'auto' }} />
      </div>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', fontSize: '13px', lineHeight: 1.5 }}>
        <div style={{ textAlign: 'right', maxWidth: '280px' }}>
          {addressLines.length > 0 ? (
            addressLines.map((l, i) => (
              <div key={i} style={{ marginBottom: '1px' }}>
                {l}{i < addressLines.length - 1 ? ',' : ''}
              </div>
            ))
          ) : (
            <span style={{ color: '#999', fontStyle: 'italic' }}>[Address not set]</span>
          )}
          {senderEmail && <div style={{ marginTop: '6px', fontWeight: '500' }}>E-mail: {senderEmail}</div>}
        </div>
      </div>
    </div>
  );

  const QRPlaceholder = () => (
    <div style={{ width: '70px', textAlign: 'center', fontSize: '9px', fontFamily: 'Arial', color: '#999' }}>
      <div style={{ width: '70px', height: '70px', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 3px', border: '1px dashed #ccc', fontSize: '10px', color: '#aaa' }}>QR</div>
      Scan to Verify
    </div>
  );

  // ── GENERAL ──
  if (slug === 'general' || slug === 'state-central') {
    return (
      <div style={pageStyle}>
        <StandardHeader />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '14px' }}>
          <div style={{ lineHeight: 1.6 }}>To,<br /><strong>Shri {letter.recipientName || '[Recipient]'}</strong><br /><span dangerouslySetInnerHTML={{ __html: (letter.recipientAddress || '').replace(/\n/g, '<br/>') }} /></div>
          <div style={{ whiteSpace: 'nowrap' }}>Date: {formatDate(letter.date)}</div>
        </div>
        <div style={{ fontWeight: 'bold', marginBottom: '15px', fontSize: '14px' }}>Subject: {letter.subject || '[Subject]'}</div>
        <div style={{ marginBottom: '12px', fontSize: '14px' }}>Sir,</div>
        <div>
          {parsedBody.length > 0 ? parsedBody.map((p, i) => <p key={i} style={{ textAlign: 'justify', lineHeight: 1.6, marginBottom: '12px' }}>{p}</p>)
            : <p style={{ color: '#aaa', fontStyle: 'italic' }}>[Letter body will appear here]</p>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '30px' }}>
          <div style={{ textAlign: 'left', fontSize: '14px' }}>
            <div style={{ fontSize: '14px' }}>Yours sincerely,</div>
            <div style={{ height: '60px' }}>
              {effectiveUser?.signatureUrl && (
                <img src={effectiveUser.signatureUrl} alt="Signature" style={{ height: '60px', maxWidth: '200px', objectFit: 'contain' }} />
              )}
            </div>
            <div style={{ fontWeight: 'bold' }}>{senderName}</div>
            <div style={{ fontSize: '13px' }}>{designation}{organization ? `, ${organization}` : ''}</div>
          </div>
          <QRPlaceholder />
        </div>
        {slug === 'state-central' && (
          <div style={{ marginTop: '20px', fontSize: '13px', lineHeight: 1.7 }}>
            <strong>Copy to:</strong><br />
            {letter.copyTo ? <span dangerouslySetInnerHTML={{ __html: letter.copyTo.replace(/\n/g, '<br/>') }} /> : <span style={{ color: '#aaa' }}>[Copy to recipients]</span>}
          </div>
        )}
      </div>
    );
  }

  // ── DISTRICT ORDER ──
  if (slug === 'district-order') {
    const orgName = letter.districtOrgName || organization || '[Organization Name]';
    const deptName = letter.districtDeptName || department || '';
    return (
      <div style={pageStyle}>
        {/* Centered header: Emblem + bold org + dept */}
        <div style={{ textAlign: 'center', marginBottom: '16px', borderBottom: '1px solid #999', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
            <img src={EMBLEM_URL} alt="Emblem" style={{ width: '55px', height: 'auto' }} />
          </div>
          <div style={{ fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', lineHeight: 1.5 }}>{orgName}</div>
          {deptName && <div style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>({deptName})</div>}
          {defaultAddress && <div style={{ fontSize: '12px', marginTop: '4px' }}>{defaultAddress.replace(/\n/g, ', ')}</div>}
        </div>
        <div style={{ textAlign: 'center', fontSize: '16px', fontWeight: 'bold', textDecoration: 'underline', margin: '16px 0 20px', letterSpacing: '2px' }}>ORDER</div>
        <div style={{ textAlign: 'justify' }}>
          {parsedBody.length > 0 ? parsedBody.map((p, i) => <p key={i} style={{ lineHeight: 1.7, marginBottom: '14px', fontSize: '13px' }}>{p}</p>)
            : <p style={{ color: '#aaa', fontStyle: 'italic' }}>[Order body will appear here]</p>}
        </div>
        {/* Signature right-aligned */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
          <div style={{ textAlign: 'right', fontSize: '13px' }}>
            <div style={{ height: '50px' }}>
              {effectiveUser?.signatureUrl && (
                <img src={effectiveUser.signatureUrl} alt="Signature" style={{ height: '50px', maxWidth: '200px', objectFit: 'contain' }} />
              )}
            </div>
            <div style={{ fontWeight: 'bold' }}>({effectiveUser?.name || ''})</div>
            <div>{designation}</div>
            {organization && <div>{organization}</div>}
            <QRPlaceholder />
          </div>
        </div>
        {/* Memo No. and Copy section BELOW signature */}
        <div style={{ marginTop: '24px', fontSize: '12px', lineHeight: 1.8 }}>
          <div>Memo No. E {letter.memoNo || letter.refNo || ''} -A,</div>
          <div>Copy for kind information and necessary action to:</div>
          {(letter.orderCopyList || []).length > 0 ? (
            <ol style={{ margin: '6px 0 0 18px', lineHeight: 1.7 }}>
              {(letter.orderCopyList || []).map((item, i) => <li key={i}>{item}</li>)}
            </ol>
          ) : <div style={{ color: '#aaa', marginTop: '4px' }}>[Copy recipients]</div>}
        </div>
      </div>
    );
  }

  // ── MPLAD ──
  if (slug === 'mplad') {
    const rows = letter.mplaadTableData || [];
    return (
      <div style={pageStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #8B0000', paddingBottom: '10px', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#8B0000' }}>{effectiveUser?.name || '[Name]'}</div>
            <div style={{ fontSize: '13px', fontStyle: 'italic' }}>{houseType ? `Member of Parliament (${houseType})` : designation}</div>
            <div style={{ fontSize: '12px', color: '#333', marginTop: '4px' }}>{constituency ? `Constituency: ${constituency}` : ''}{state ? `, ${state}` : ''}</div>
          </div>
          <div style={{ flexShrink: 0, padding: '0 16px' }}><img src={EMBLEM_URL} alt="Emblem" style={{ width: '55px' }} /></div>
          <div style={{ flex: 1, textAlign: 'right', fontSize: '12px', lineHeight: 1.6 }}>
            {addressLines.map((l, i) => <div key={i}>{l}</div>)}
            {senderEmail && <div>e-mail: {senderEmail}</div>}
          </div>
        </div>
        <div style={{ marginBottom: '16px', fontSize: '14px' }}>To<br /><strong>{letter.recipientName || '[Recipient]'}</strong><br /><span dangerouslySetInnerHTML={{ __html: (letter.recipientAddress || '').replace(/\n/g, '<br/>') }} /></div>
        <div style={{ marginBottom: '10px' }}>Dear Sir,</div>
        <div style={{ textAlign: 'center', fontWeight: 'bold', textDecoration: 'underline', marginBottom: '8px' }}>
          Lr. No.{letter.refNo}, Dt: {formatDate(letter.date)}
        </div>
        <div style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: '16px' }}>Subject: {letter.subject || '[Subject]'}</div>
        <div style={{ textAlign: 'center', marginBottom: '12px' }}>*** &nbsp; *** &nbsp; ***</div>
        <p style={{ textAlign: 'justify', marginBottom: '12px' }}>{letter.mplaadOpeningPara || letter.body || '[Opening paragraph]'}</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', margin: '12px 0', fontSize: '13px' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #000', padding: '6px 8px', background: '#f5f5f5', width: '10%' }}>Priority No.</th>
              <th style={{ border: '1px solid #000', padding: '6px 8px', background: '#f5f5f5' }}>Name and Nature of work / Equipment Name &amp; Location</th>
              <th style={{ border: '1px solid #000', padding: '6px 8px', background: '#f5f5f5', width: '18%' }}>Approximate cost</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? rows.map((r, i) => (
              <tr key={i}>
                <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>{r.priorityNo}</td>
                <td style={{ border: '1px solid #000', padding: '6px 8px' }}>{r.workDescription}</td>
                <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>{r.cost}</td>
              </tr>
            )) : (
              <tr><td style={{ border: '1px solid #000', padding: '14px 8px' }} colSpan={3}>&nbsp;</td></tr>
            )}
          </tbody>
        </table>
        <p style={{ textAlign: 'justify', marginTop: '14px', fontSize: '13px' }}>{letter.mplaadClosingPara || '[Closing paragraph]'}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <div style={{ textAlign: 'right', fontSize: '13px' }}>
            <div>Yours faithfully,</div>
            <div style={{ height: '50px' }}>
              {effectiveUser?.signatureUrl && (
                <img src={effectiveUser.signatureUrl} alt="Signature" style={{ height: '50px', maxWidth: '200px', objectFit: 'contain' }} />
              )}
            </div>
            <div style={{ fontWeight: 'bold' }}>{effectiveUser?.name || ''}</div>
            <div>{designation || (houseType ? `M.P. (${houseType})` : '')}</div>
            <QRPlaceholder />
          </div>
        </div>
        <div style={{ marginTop: '20px', fontSize: '13px', lineHeight: 1.8 }}>
          <strong>Copy to:</strong>{' '}
          {letter.copyTo
            ? <span dangerouslySetInnerHTML={{ __html: letter.copyTo.replace(/\n/g, '<br/>') }} />
            : <span style={{ color: '#aaa' }}>[Copy to]</span>}
        </div>
      </div>
    );
  }

  return <div style={{ ...pageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>Select a template to preview</div>;
}

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
  };
  user: {
    name: string;
    email?: string;
    designation?: string;
    department?: string;
    organization?: string;
    defaultAddress?: string;
  } | null;
}

export default function LetterRenderer({ letter, user }: LetterRendererProps) {
  const senderName = user ? `Shri ${user.name}` : 'Shri Member Name';
  const designation = user?.designation || '';
  const department = user?.department || '';
  const organization = user?.organization || '';
  const defaultAddress = user?.defaultAddress || '';
  const senderEmail = user?.email || '';

  const parsedBody = letter.body ? letter.body.split('\n').filter(p => p.trim() !== '') : [];

  // Parse address into structured lines
  const addressLines = defaultAddress
    ? defaultAddress.split(/[,\n]/).map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <div
      className="bg-white shadow-sm border border-gray-200 mx-auto page"
      style={{
        width: '210mm',
        minHeight: '297mm',
        fontFamily: "'Times New Roman', Times, serif",
        color: '#000',
        position: 'relative',
        padding: '8mm 15mm 20mm 15mm',
        boxSizing: 'border-box',
        fontSize: '13px',
      }}
    >
      <div 
        className="page-header" 
        style={{
          marginBottom: '10px',
          marginTop: '0',
          paddingTop: '0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '1px solid #999',
          paddingBottom: '10px'
        }}
      >
        {/* Left: Name + Info */}
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '3px', fontFamily: "'Times New Roman', Times, serif" }}>
            {senderName}
          </div>
          {designation && (
            <div style={{ fontSize: '13px', fontStyle: 'italic', lineHeight: 1.4 }}>{designation}</div>
          )}
          {department && (
            <div style={{ fontSize: '13px', fontStyle: 'italic', lineHeight: 1.4 }}>{department}</div>
          )}
          {organization && (
            <div style={{ fontSize: '13px', fontStyle: 'italic', lineHeight: 1.4 }}>{organization}</div>
          )}
        </div>

        {/* Center: Emblem */}
        <div style={{ flexShrink: 0, textAlign: 'center', padding: '0 20px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
            alt="National Emblem"
            style={{ width: '65px', height: 'auto' }}
          />
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#333', marginTop: '2px' }}>
            सत्यमेव जयते
          </div>
        </div>

        {/* Right: Address (structured) */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', fontSize: '13px', lineHeight: 1.6, marginTop: '2px' }}>
          <div style={{ textAlign: 'right', maxWidth: '250px' }}>
            {addressLines.length > 0 ? (
              addressLines.map((line, idx) => (
                <div key={idx}>{line}{idx < addressLines.length - 1 ? ',' : ''}</div>
              ))
            ) : (
              <span style={{ color: '#999', fontStyle: 'italic' }}>[Address not set]</span>
            )}
            {senderEmail && (
              <div style={{ marginTop: '8px' }}>E-mail: {senderEmail}</div>
            )}
          </div>
        </div>
      </div>

      <div 
        className="page-content content"
        style={{
          marginTop: '0',
          textAlign: 'justify',
          position: 'relative'
        }}
      >
        {/* === To / Date === */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '14px' }}>
          <div style={{ lineHeight: 1.6 }}>
            To,<br />
            <strong>Shri {letter.recipientName || '[Recipient Name]'}</strong><br />
            <span dangerouslySetInnerHTML={{ __html: (letter.recipientAddress || '[Designation]').replace(/\n/g, '<br/>') }} />
          </div>
          <div style={{ whiteSpace: 'nowrap' }}>
            Date: {letter.date
              ? new Date(letter.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '-')
              : '[Date]'}
          </div>
        </div>

        {/* === Subject === */}
        <div style={{ fontWeight: 'bold', marginBottom: '15px', fontSize: '14px' }}>
          Subject: {letter.subject || '[Subject]'}
        </div>

        {/* === Salutation === */}
        <div style={{ marginBottom: '12px', fontSize: '14px' }}>Sir,</div>

        {/* === Body === */}
        <div>
          {parsedBody.length > 0 ? (
            parsedBody.map((p, idx) => (
              <p key={idx} style={{
                textAlign: 'justify',
                lineHeight: 1.6,
                marginBottom: '12px',
                fontFamily: "'Times New Roman', serif",
                fontSize: '13px'
              }}>
                {p}
              </p>
            ))
          ) : (
            <p style={{
              textAlign: 'justify',
              lineHeight: 1.6,
              marginBottom: '12px',
              fontFamily: "'Times New Roman', serif",
              fontSize: '13px'
            }}>[Letter Body]</p>
          )}
        </div>

        {/* === Footer Row === */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '40px', pageBreakInside: 'avoid' }}>
          {/* === Signature Block === */}
          <div style={{ fontSize: '14px' }}>
            <div>Yours sincerely,</div>
            <div style={{ height: '70px' }}></div>
            <div style={{ fontWeight: 'bold' }}>{senderName}</div>
            <div style={{ fontSize: '13px' }}>
              {designation}{organization ? `, ${organization}` : ''}
            </div>
          </div>

          {/* === QR Placeholder === */}
          <div 
            className="qr"
            style={{
              width: '80px',
              textAlign: 'center',
              fontSize: '9px',
              fontFamily: 'Arial, sans-serif',
              color: '#999',
            }}
          >
            <div style={{ width: '80px', height: '80px', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 3px auto', fontSize: '10px', color: '#aaa', border: '1px dashed #ccc' }}>
              QR Code
            </div>
            Scan to Verify
          </div>
        </div>
      </div>
    </div>
  );
}

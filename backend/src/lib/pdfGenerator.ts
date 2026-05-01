import puppeteer, { Browser } from 'puppeteer';
import qrcode from 'qrcode';
// @ts-ignore
import chromium from '@sparticuz/chromium';
import fs from 'fs';
import path from 'path';

// ── Singleton browser ──────────────────────────────────────────────────────────
let _browser: Browser | null = null;
let _launching: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
  if (_browser?.connected) return _browser;
  if (_launching) return _launching;

  _launching = (async () => {
    console.log('[PDF] Launching Chromium…');
    const args = [
      '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
      '--disable-gpu', '--disable-extensions', '--single-process', '--no-zygote',
    ];

    let browser: Browser;
    if (process.env.NODE_ENV === 'production') {
      browser = await puppeteer.launch({
        args: [...chromium.args, ...args],
        defaultViewport: (chromium as any).defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: true,
      });
    } else {
      browser = await puppeteer.launch({ headless: true, args });
    }

    _browser = browser;
    browser.on('disconnected', () => {
      console.log('[PDF] Browser disconnected — will relaunch on next request');
      _browser = null;
      _launching = null;
    });

    console.log('[PDF] Browser ready ✓');
    return browser;
  })();

  return _launching;
}

export async function warmBrowser(): Promise<void> {
  await getBrowser();
}

// ── Shared utilities ───────────────────────────────────────────────────────────
function getEmblemBase64(): string {
  const emblemSvg = fs.readFileSync(path.join(process.cwd(), 'src', 'lib', 'emblem.svg'), 'utf8');
  return `data:image/svg+xml;base64,${Buffer.from(emblemSvg).toString('base64')}`;
}

function parseBodyToParagraphs(body: string): string {
  return body ? body.split('\n').filter(p => p.trim() !== '').map(p => `<p>${p}</p>`).join('') : '';
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '-');
}

// ── SHARED CSS ─────────────────────────────────────────────────────────────────
const BASE_CSS = `
  html, body { margin: 0; padding: 0; }
  @page { size: A4; margin: 8mm 15mm 20mm 15mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Times New Roman', Times, serif; color: #000; font-size: 13px; }
  .page-header {
    margin-bottom: 16px; margin-top: 8px; padding-top: 0;
    display: flex; justify-content: space-between; align-items: flex-start;
    border-bottom: 1px solid #999; padding-bottom: 10px;
  }
  .header-left { flex: 1; text-align: left; }
  .header-left .name { font-size: 18px; font-weight: bold; margin-bottom: 3px; }
  .header-left .info-line { font-size: 13px; line-height: 1.5; color: #000; }
  .header-center { flex-shrink: 0; text-align: center; padding: 0 20px; }
  .header-center img { width: 65px; height: auto; }
  .header-right { flex: 1; display: flex; justify-content: flex-end; font-size: 13px; line-height: 1.5; }
  .header-right-inner { text-align: right; max-width: 280px; }
  .meta-row { display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 14px; }
  .recipient-block { line-height: 1.6; }
  .date-block { white-space: nowrap; }
  .subject-line { font-weight: bold; margin-bottom: 15px; font-size: 14px; }
  .salutation { margin-bottom: 12px; font-size: 14px; }
  .content { text-align: justify; }
  .content p { text-align: justify; line-height: 1.6; margin-bottom: 12px; page-break-inside: avoid; }
  .footer-row { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 20px; page-break-inside: avoid; break-before: avoid; }
  .signature-block { font-size: 14px; }
  .signature-space { height: 50px; }
  .signature-name { font-weight: bold; }
  .signature-title { font-size: 13px; }
  .qr-fixed {
    position: fixed;
    bottom: 12mm;
    right: 10mm;
    width: 72px;
    text-align: center;
    font-size: 8px;
    font-family: Arial, sans-serif;
    color: #555;
    z-index: 100;
  }
  .qr-fixed img { width: 72px; height: 72px; display: block; margin: 0 auto 2px auto; border: 1px solid #ddd; padding: 1px; }
  .copy-to-section { margin-top: 20px; font-size: 13px; line-height: 1.6; }
  .copy-to-section strong { font-weight: bold; }
`;

// ── TEMPLATE: GENERAL LETTER (and State/Central) ───────────────────────────────
function buildGeneralLetterHTML(letter: any, qrCodeDataUrl: string, emblemBase64: string, includeCopyTo: boolean): string {
  const sender = letter.sender;
  const senderName = sender.name ? `Shri ${sender.name}` : '';
  const designation = sender.designation || '';
  const department = sender.department || '';
  const organization = sender.organization || '';
  const constituency = sender.constituency || '';
  const state = sender.state || '';
  const defaultAddress = sender.defaultAddress || '';
  const senderEmail = sender.email || '';

  let addressHtml = '';
  if (defaultAddress) {
    const addressLines = defaultAddress.split(/[,\n]/).map((s: string) => s.trim()).filter(Boolean);
    addressHtml = addressLines.map((line: string, idx: number) =>
      `<div style="line-height:1.5;margin-bottom:1px;">${line}${idx < addressLines.length - 1 ? ',' : ''}</div>`
    ).join('');
  }
  const emailLine = senderEmail ? `<div style="margin-top:8px;">E-mail: ${senderEmail}</div>` : '';
  const parsedBody = parseBodyToParagraphs(letter.body);

  const signatureImageHtml = sender.signatureUrl
    ? `<img src="${sender.signatureUrl}" style="height:60px;max-width:200px;object-fit:contain;mix-blend-mode:multiply;" />`
    : '';
  const sealImageHtml = sender.sealUrl
    ? `<img src="${sender.sealUrl}" style="height:80px;width:80px;object-fit:contain;opacity:0.8;position:absolute;left:40px;top:0;z-index:1;" />`
    : '';

  const copyToHtml = includeCopyTo && letter.copyTo
    ? `<div class="copy-to-section"><strong>Copy to:</strong><br>${letter.copyTo.replace(/\n/g, '<br>')}</div>`
    : (includeCopyTo ? `<div class="copy-to-section" style="margin-top:24px;"><strong>Copy to:</strong><br><br></div>` : '');

  return `<!DOCTYPE html><html><head><style>${BASE_CSS}</style></head>
  <body>
    <table style="width:100%;border-collapse:collapse;border:none;">
      <thead style="display:table-header-group;">
        <tr><td style="padding:0;border:none;">
          <div class="page-header">
            <div class="header-left">
              <div class="name">${senderName}</div>
              <div class="info-line" style="font-style:italic;">${designation}</div>
              ${constituency ? `<div class="info-line">Constituency: ${constituency}</div>` : ''}
              ${state ? `<div class="info-line">State: ${state}</div>` : ''}
              ${department ? `<div class="info-line" style="font-style:italic;">${department}</div>` : ''}
              ${organization ? `<div class="info-line" style="font-style:italic;">${organization}</div>` : ''}
            </div>
            <div class="header-center"><img src="${emblemBase64}" alt="Emblem"></div>
            <div class="header-right">
              <div class="header-right-inner">
                ${addressHtml}
                ${senderEmail ? `<div style="margin-top:6px;font-weight:bold;">E-mail: ${senderEmail}</div>` : ''}
              </div>
            </div>
          </div>
        </td></tr>
      </thead>
      <tbody><tr><td style="padding:0;border:none;">
        <div class="content">
          <div class="meta-row">
            <div class="recipient-block">To,<br><strong>Shri ${letter.recipientName}</strong><br>${letter.recipientAddress.replace(/\n/g, '<br>')}</div>
            <div class="date-block">Date: ${formatDate(letter.date)}</div>
          </div>
          <div class="subject-line">Subject: ${letter.subject}</div>
          <div class="salutation">Sir,</div>
          <div>${parsedBody}</div>
          <div class="footer-row">
            <div style="position:relative;flex:1;">
              <div class="signature-block">
                <div>Yours sincerely,</div>
                <div class="signature-space" style="position:relative;height:80px;display:flex;align-items:center;">
                  ${signatureImageHtml}${sealImageHtml}
                </div>
                <div class="signature-name">${senderName}</div>
                <div class="signature-title">${designation}${organization ? ', ' + organization : ''}</div>
              </div>
            </div>
          </div>
          <div class="qr-fixed"><img src="${qrCodeDataUrl}" alt="QR"><div>Scan to Verify</div></div>
          ${copyToHtml}
        </div>
      </td></tr></tbody>
    </table>
  </body></html>`;
}

// ── TEMPLATE: DISTRICT ORDER ───────────────────────────────────────────────────
function buildDistrictOrderHTML(letter: any, qrCodeDataUrl: string, emblemBase64: string): string {
  const sender = letter.sender;
  const orgName = letter.districtOrgName || sender.organization || '';
  const deptName = letter.districtDeptName || sender.department || '';
  const defaultAddress = sender.defaultAddress || '';

  const parsedBody = parseBodyToParagraphs(letter.body);

  // Parse the numbered copy list
  let copyList: string[] = [];
  try {
    if (letter.orderCopyList) copyList = JSON.parse(letter.orderCopyList);
  } catch (_) {}

  const copyListHtml = copyList.length > 0
    ? `<ol style="margin:6px 0 0 18px;line-height:1.7;">${copyList.map(item => `<li>${item}</li>`).join('')}</ol>`
    : '<div style="margin-top:8px;line-height:2;">&nbsp;</div>';

  return `<!DOCTYPE html><html><head><style>
    ${BASE_CSS}
    .order-header { text-align:center; margin-bottom:12px; border-bottom:1px solid #999; padding-bottom:12px; }
    .order-header .org-name { font-size:15px; font-weight:bold; text-transform:uppercase; line-height:1.5; }
    .order-header .dept-name { font-size:13px; font-weight:bold; text-transform:uppercase; }
    .order-header .address-line { font-size:12px; margin-top:4px; }
    .order-title { text-align:center; font-size:16px; font-weight:bold; text-decoration:underline; margin:16px 0 20px; letter-spacing:2px; }
    .order-body p { text-align:justify; line-height:1.7; margin-bottom:14px; font-size:13px; }
    .memo-section { margin-top:24px; font-size:12px; line-height:1.8; }
    .signature-right { text-align:right; font-size:13px; margin-top:24px; display:flex; justify-content:flex-end; }
    .signature-right .sig-space { height:60px; }
  </style></head>
  <body>
    <div class="order-header">
      <div style="display:flex;justify-content:center;margin-bottom:8px;">
        <img src="${emblemBase64}" style="width:60px;height:auto;" alt="Emblem">
      </div>
      <div class="org-name">${orgName}</div>
      ${deptName ? `<div class="dept-name">(${deptName})</div>` : ''}
      ${defaultAddress ? `<div class="address-line">${defaultAddress.replace(/\n/g, ', ')}</div>` : ''}
    </div>

    <div class="order-title">ORDER</div>

    <div class="order-body">${parsedBody}</div>

    <div class="signature-right">
      <div>
        <div class="sig-space"></div>
        <div style="font-weight:bold;">(${sender.name || ''})</div>
        <div>${sender.designation || ''}</div>
        ${orgName ? `<div>${orgName}</div>` : ''}
        <div>Dated ${new Date(letter.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
      </div>
    </div>
    <div class="qr-fixed"><img src="${qrCodeDataUrl}" alt="QR"><div>Scan to Verify</div></div>

    <div class="memo-section">
      Memo No. E ${letter.memoNo || letter.refNo} -A,<br>
      Copy for kind information and necessary action to:
      ${copyListHtml}
    </div>
  </body></html>`;
}

// ── TEMPLATE: MPLAD LETTER ─────────────────────────────────────────────────────
function buildMPLADLetterHTML(letter: any, qrCodeDataUrl: string, emblemBase64: string): string {
  const sender = letter.sender;
  const senderName = sender.name || '';
  const designation = sender.designation || '';
  const constituency = sender.constituency || '';
  const state = sender.state || '';
  const houseType = sender.houseType || '';
  const defaultAddress = sender.defaultAddress || '';
  const senderEmail = sender.email || '';

  // Parse MPLAD table rows
  let tableRows: { priorityNo: string; workDescription: string; cost: string }[] = [];
  try {
    if (letter.mplaadTableData) tableRows = JSON.parse(letter.mplaadTableData);
  } catch (_) {}

  const tableRowsHtml = tableRows.length > 0
    ? tableRows.map(row => `
      <tr>
        <td style="border:1px solid #000;padding:6px 8px;text-align:center;vertical-align:top;">${row.priorityNo}</td>
        <td style="border:1px solid #000;padding:6px 8px;vertical-align:top;">${row.workDescription}</td>
        <td style="border:1px solid #000;padding:6px 8px;text-align:center;vertical-align:top;">${row.cost}</td>
      </tr>`).join('')
    : `<tr>
        <td style="border:1px solid #000;padding:12px 8px;text-align:center;"></td>
        <td style="border:1px solid #000;padding:12px 8px;"></td>
        <td style="border:1px solid #000;padding:12px 8px;text-align:center;"></td>
      </tr>`;

  // Address block: each comma-separated or newline-separated part on its own line
  const addressLines = defaultAddress.split(/[\n,]/).map((l: string) => l.trim()).filter(Boolean);
  const addressHtml = addressLines.map((l: string) => `<div>${l}</div>`).join('');

  const copyToHtml = letter.copyTo
    ? `<div style="margin-top:24px;font-size:13px;line-height:1.8;"><strong>Copy to:</strong> ${letter.copyTo.replace(/\n/g, '<br>')}</div>`
    : `<div style="margin-top:24px;font-size:13px;"><strong>Copy to:</strong><br><br></div>`;

  const parsedBody = parseBodyToParagraphs(letter.body);

  return `<!DOCTYPE html><html><head><style>
    ${BASE_CSS}
    .mplad-header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #8B0000; padding-bottom:10px; margin-bottom:24px; }
    .mplad-left { flex:1; }
    .mplad-left .mp-name { font-size:20px; font-weight:bold; color:#8B0000; font-family:'Times New Roman',serif; margin-bottom:4px; }
    .mplad-left .mp-designation { font-size:13px; font-style:italic; color:#222; }
    .mplad-left .mp-constituency { font-size:12px; line-height:1.8; margin-top:5px; color:#333; }
    .mplad-left .mp-constituency .label { font-size:10px; text-transform:uppercase; letter-spacing:0.5px; color:#888; display:block; line-height:1.2; }
    .mplad-left .mp-constituency .value { font-size:12px; font-weight:600; color:#222; display:block; }
    .mplad-center { flex-shrink:0; text-align:center; padding:0 16px; }
    .mplad-center img { width:60px; }
    .mplad-right { flex:1; text-align:right; font-size:12px; line-height:1.8; color:#222; }
    .mplad-right .addr-line:first-child { font-weight:600; font-size:12px; }
    .mplad-right .addr-line { font-size:12px; color:#333; }
    .mplad-right .addr-email { margin-top:5px; font-size:11px; color:#555; border-top:1px solid #ddd; padding-top:4px; }
    .works-table { width:100%; border-collapse:collapse; margin:12px 0; font-size:13px; }
    .works-table th { border:1px solid #000; padding:6px 8px; background:#f5f5f5; font-weight:bold; text-align:center; }
    .works-table td { border:1px solid #000; padding:6px 8px; }
    .ref-line { font-weight:bold; text-decoration:underline; text-align:center; margin-bottom:8px; font-size:13px; }
  </style></head>
  <body>
    <div class="mplad-header">
      <div class="mplad-left">
        <div class="mp-name">${senderName}</div>
        <div class="mp-designation">${houseType ? `Member of Parliament (${houseType})` : designation}</div>
        <div class="mp-constituency">
          ${constituency ? `<span class="label">Constituency</span><span class="value">${constituency}</span>` : ''}
          ${state ? `<span class="label" style="margin-top:3px;">State</span><span class="value">${state}</span>` : ''}
        </div>
      </div>
      <div class="mplad-center"><img src="${emblemBase64}" alt="Emblem"></div>
      <div class="mplad-right">
        ${addressLines.map((l: string) => `<div class="addr-line">${l}</div>`).join('')}
        ${senderEmail ? `<div class="addr-email">e-mail: ${senderEmail}</div>` : ''}
      </div>
    </div>

    <div style="margin-bottom:16px;font-size:14px;line-height:1.6;">
      To<br>
      <strong>${letter.recipientName}</strong><br>
      ${letter.recipientDesignation ? `${letter.recipientDesignation}<br>` : ''}${letter.recipientAddressDetail ? letter.recipientAddressDetail.replace(/\n/g, '<br>') : ''}
    </div>

    <div style="margin-bottom:10px;font-size:14px;">Dear Sir,</div>

    <div class="ref-line">
      Lr. No.${letter.refNo}, Dt: ${new Date(letter.date).toLocaleDateString('en-GB', { day:'2-digit', month:'2-digit', year:'numeric' }).replace(/\//g,'.')}
    </div>

    <div class="subject-line" style="text-align:center;margin-bottom:16px;">Subject: ${letter.subject}</div>

    <div style="text-align:center;margin-bottom:12px;font-size:14px;">*** &nbsp;&nbsp;&nbsp; *** &nbsp;&nbsp;&nbsp; ***</div>

    <div class="content" style="margin-bottom:12px;">${parsedBody}</div>

    <table class="works-table">
      <thead>
        <tr>
          <th style="width:10%;">Priority No.</th>
          <th>Name and Nature of work / Equipment Name &amp; Location</th>
          <th style="width:18%;">Approximate cost</th>
        </tr>
      </thead>
      <tbody>${tableRowsHtml}</tbody>
    </table>

    <div class="content" style="margin-top:14px;font-size:13px;">
      <p>The technical, financial and administrative sanction for the above works may be issued after they have been duly scrutinized. The sanctioned works should be undertaken and completed as per the provisions of the MPLADS Guidelines. I may please be kept informed of the sanction and the progress of the works.</p>
    </div>

    <div style="display:flex;justify-content:flex-end;margin-top:20px;">
      <div style="text-align:right;">
        <div style="margin-bottom:4px;font-size:14px;">Yours faithfully,</div>
        <div style="height:55px;"></div>
        <div style="font-weight:bold;font-size:14px;">${senderName}</div>
        <div style="font-size:13px;">${designation || (houseType ? `M.P. (${houseType})` : '')}</div>
      </div>
    </div>
    <div class="qr-fixed"><img src="${qrCodeDataUrl}" alt="QR"><div>Scan to Verify</div></div>
    ${copyToHtml}
  </body></html>`;
}

// ── MAIN EXPORT ────────────────────────────────────────────────────────────────
export const generateLetterPDF = async (letter: any, qrToken: string, frontendUrl: string): Promise<Buffer> => {
  const verifyUrl = `${frontendUrl}/verify?token=${qrToken}`;
  const qrCodeDataUrl = await qrcode.toDataURL(verifyUrl, { 
    margin: 1, 
    width: 150,
    errorCorrectionLevel: 'L'
  });
  const emblemBase64 = getEmblemBase64();

  const templateSlug = letter.template?.slug || 'general';

  let html: string;
  switch (templateSlug) {
    case 'state-central':
      html = buildGeneralLetterHTML(letter, qrCodeDataUrl, emblemBase64, true);
      break;
    case 'district-order':
      html = buildDistrictOrderHTML(letter, qrCodeDataUrl, emblemBase64);
      break;
    case 'mplad':
      html = buildMPLADLetterHTML(letter, qrCodeDataUrl, emblemBase64);
      break;
    case 'general':
    default:
      html = buildGeneralLetterHTML(letter, qrCodeDataUrl, emblemBase64, false);
      break;
  }

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 20000 });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '8mm', bottom: '20mm', left: '15mm', right: '15mm' },
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: `
        <div style="font-size:10px;text-align:center;width:100%;font-family:'Times New Roman',Times,serif;color:#666;padding-bottom:5mm;">
          Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>
      `
    });
    return pdfBuffer as Buffer;
  } finally {
    await page.close();
  }
};

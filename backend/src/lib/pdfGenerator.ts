import puppeteer from 'puppeteer';
import qrcode from 'qrcode';
// @ts-ignore
import chromium from '@sparticuz/chromium';
import fs from 'fs';
import path from 'path';

export const generateLetterPDF = async (letter: any, qrToken: string, frontendUrl: string) => {
  const verifyUrl = `${frontendUrl}/verify?token=${qrToken}`;
  const qrCodeDataUrl = await qrcode.toDataURL(verifyUrl, {
    margin: 1,
    width: 150,
  });

  const emblemSvg = fs.readFileSync(path.join(process.cwd(), 'src', 'lib', 'emblem.svg'), 'utf8');
  const emblemBase64 = `data:image/svg+xml;base64,${Buffer.from(emblemSvg).toString('base64')}`;

  const sender = letter.sender;
  const senderName = sender.name ? `Shri ${sender.name}` : '';
  const designation = sender.designation || '';
  const department = sender.department || '';
  const organization = sender.organization || '';
  const defaultAddress = sender.defaultAddress || '';
  const senderEmail = sender.email || '';

  // Parse address into structured lines for a clean, professional look
  let addressHtml = '';
  if (defaultAddress) {
    const addressLines = defaultAddress.split(/[,\n]/).map((s: string) => s.trim()).filter(Boolean);
    addressHtml = addressLines.map((line: string, idx: number) =>
      `<div style="line-height: 1.6;">${line}${idx < addressLines.length - 1 ? ',' : ''}</div>`
    ).join('');
  }
  const emailLine = senderEmail ? `<div style="margin-top:8px;">E-mail: ${senderEmail}</div>` : '';

  // Parse body into paragraphs
  const parsedBody = letter.body ? letter.body.split('\n').filter((p: string) => p.trim() !== '').map((p: string) => `<p>${p}</p>`).join('') : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;700&display=swap" rel="stylesheet">
      <style>
        html, body {
          margin: 0;
          padding: 0;
        }

        @page { 
          size: A4; 
          margin: 8mm 15mm 20mm 15mm; 
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
          font-family: 'Times New Roman', 'Noto Sans Devanagari', Times, serif;
          color: #000;
          font-size: 13px;
        }

        .page {
          /* Removed page-break-after: always; to prevent extra blank pages */
        }

        .page-header {
          margin-bottom: 20px;
          margin-top: 10px;
          padding-top: 0;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid #999;
          padding-bottom: 10px;
        }

        .page-content {
          page-break-inside: auto;
          margin-top: 0;
        }

        .header-left {
          flex: 1;
          text-align: left;
        }
        .header-left .name {
          font-size: 18px;
          font-weight: bold;
          font-family: 'Times New Roman', 'Noto Sans Devanagari', Times, serif;
          margin-bottom: 3px;
        }
        .header-left .info-line {
          font-size: 13px;
          font-style: italic;
          line-height: 1.4;
        }
        .header-center {
          flex-shrink: 0;
          text-align: center;
          padding: 0 20px;
        }
        .header-center img {
          width: 65px;
          height: auto;
        }
        .header-center .motto {
          font-size: 11px;
          font-weight: bold;
          color: #333;
          margin-top: 2px;
        }
        .header-right {
          flex: 1;
          display: flex;
          justify-content: flex-end;
          font-size: 13px;
          line-height: 1.4;
          margin-top: 2px;
        }
        .header-right-inner {
          text-align: right;
          max-width: 250px;
        }

        /* === Meta === */
        .meta-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          font-size: 14px;
        }
        .recipient-block {
          line-height: 1.6;
        }
        .date-block {
          white-space: nowrap;
        }

        /* === Body === */
        .subject-line {
          font-weight: bold;
          margin-bottom: 15px;
          font-size: 14px;
        }
        .salutation {
          margin-bottom: 12px;
          font-size: 14px;
        }

        .content {
          text-align: justify;
          position: relative;
        }
        .content p {
          text-align: justify;
          line-height: 1.6;
          margin-bottom: 12px;
          font-family: 'Times New Roman', 'Noto Sans Devanagari', serif;
          page-break-inside: avoid;
        }

        /* === Footer Row === */
        .footer-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 20px;
          page-break-inside: avoid;
          page-break-before: avoid;
          break-before: avoid;
        }

        /* === Signature === */
        .signature-block {
          font-size: 14px;
        }
        .signature-space {
          height: 50px;
        }
        .signature-name {
          font-weight: bold;
        }
        .signature-title {
          font-size: 13px;
        }

        /* === QR Code === */
        .qr {
          width: 70px;
          text-align: center;
          font-size: 9px;
          font-family: Arial, sans-serif;
          color: #666;
        }
        .qr img {
          width: 70px;
          height: 70px;
          display: block;
          margin: 0 auto 3px auto;
        }
      </style>
    </head>
    <body>
      <table style="width: 100%; border-collapse: collapse; border: none; margin: 0; padding: 0;">
        <thead style="display: table-header-group;">
          <tr>
            <td style="padding: 0; border: none;">
              <div class="page-header" style="background-color: #fff; position: relative; z-index: 10;">
                <div class="header-left">
                  <div class="name">${senderName}</div>
                  <div class="info-line">${designation}</div>
                  <div class="info-line">${department}</div>
                  <div class="info-line">${organization}</div>
                </div>

                <div class="header-center">
                  <img src="${emblemBase64}" alt="National Emblem">
                  <div class="motto">सत्यमेव जयते</div>
                </div>

                <div class="header-right">
                  <div class="header-right-inner">
                    ${addressHtml}
                    ${emailLine}
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 0; border: none;">
              <div class="page">
                <div class="page-content content">
                  <!-- To / Date -->
                  <div class="meta-row">
                    <div class="recipient-block">
                      To,<br>
                      <strong>Shri ${letter.recipientName}</strong><br>
                      ${letter.recipientAddress.replace(/\n/g, '<br>')}
                    </div>
                    <div class="date-block">
                      Date: ${new Date(letter.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '-')}
                    </div>
                  </div>

                  <!-- Subject -->
                  <div class="subject-line">
                    Subject: ${letter.subject}
                  </div>

                  <!-- Salutation -->
                  <div class="salutation">Sir,</div>

                  <!-- Body -->
                  <div>${parsedBody}</div>

                  <!-- Footer Row -->
                  <div class="footer-row">
                    <!-- Signature -->
                    <div class="signature-block">
                      <div>Yours sincerely,</div>
                      <div class="signature-space"></div>
                      <div class="signature-name">${senderName}</div>
                      <div class="signature-title">${designation}${organization ? ', ' + organization : ''}</div>
                    </div>

                    <!-- QR Code -->
                    <div class="qr">
                      <img src="${qrCodeDataUrl}" alt="Verification QR Code">
                      <div>Scan to Verify</div>
                    </div>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </body>
    </html>
  `;

  let browser;
  if (process.env.NODE_ENV === 'production') {
    browser = await puppeteer.launch({
      args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--single-process'],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  } else {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  }
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 20000 });
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '8mm', bottom: '20mm', left: '15mm', right: '15mm' }
  });

  await browser.close();
  return pdfBuffer;
};

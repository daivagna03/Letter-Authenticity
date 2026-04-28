import PDFDocument from 'pdfkit';
import qrcode from 'qrcode';
import fs from 'fs';
import path from 'path';

export const generateLetterPDF = async (letter: any, qrToken: string, frontendUrl: string): Promise<Buffer> => {
  // ── Prepare assets ──────────────────────────────────────────────────────────
  const verifyUrl = `${frontendUrl}/verify?token=${qrToken}`;
  const qrPngBuffer = await qrcode.toBuffer(verifyUrl, { margin: 1, width: 150 });

  const emblemPath = path.join(process.cwd(), 'src', 'lib', 'emblem.png');
  const hasEmblem = fs.existsSync(emblemPath);

  // ── Extract sender info ─────────────────────────────────────────────────────
  const sender = letter.sender || {};
  const senderName = sender.name ? `Shri ${sender.name}` : '';
  const designation = sender.designation || '';
  const department = sender.department || '';
  const organization = sender.organization || '';
  const defaultAddress = sender.defaultAddress || '';
  const senderEmail = sender.email || '';

  const addressLines = defaultAddress
    ? defaultAddress.split(/[,\n]/).map((s: string) => s.trim()).filter(Boolean)
    : [];

  const bodyParagraphs = letter.body
    ? letter.body.split('\n').filter((p: string) => p.trim() !== '')
    : [];

  // ── Page constants (A4 = 595.28 × 841.89 pt) ───────────────────────────────
  const PW = 595.28;                       // page width
  const ML = 42.52;                        // 15 mm left margin
  const MR = 42.52;                        // 15 mm right margin
  const MT = 22.68;                        // 8 mm top margin
  const MB = 56.69;                        // 20 mm bottom margin
  const CW = PW - ML - MR;                // content width

  // ── Create document ─────────────────────────────────────────────────────────
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: MT, bottom: MB, left: ML, right: MR },
    bufferPages: true,
  });

  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  let y = MT;

  // ══════════════════════════════════════════════════════════════════════════════
  //  HEADER
  // ══════════════════════════════════════════════════════════════════════════════

  // ── Left: sender name + details ─────────────────────────────────────────────
  const hlW = 190;
  doc.font('Times-Bold').fontSize(18).text(senderName, ML, y, { width: hlW });
  let leftY = y + doc.heightOfString(senderName, { width: hlW }) + 2;

  doc.font('Times-Italic').fontSize(13);
  for (const line of [designation, department, organization].filter(Boolean)) {
    doc.text(line, ML, leftY, { width: hlW });
    leftY += 16;
  }

  // ── Center: emblem ──────────────────────────────────────────────────────────
  const emblemW = 55;
  const emblemX = (PW - emblemW) / 2;
  if (hasEmblem) {
    doc.image(emblemPath, emblemX, y, { width: emblemW });
  }
  const mottoY = y + emblemW + 4;
  doc.font('Times-Bold').fontSize(9);
  doc.text('Satyameva Jayate', 0, mottoY, { width: PW, align: 'center' });

  // ── Right: address ──────────────────────────────────────────────────────────
  const hrW = 200;
  const hrX = PW - MR - hrW;
  doc.font('Times-Roman').fontSize(13);
  let rightY = y;
  for (let i = 0; i < addressLines.length; i++) {
    const txt = i < addressLines.length - 1 ? `${addressLines[i]},` : addressLines[i];
    doc.text(txt, hrX, rightY, { width: hrW, align: 'right' });
    rightY += 16;
  }
  if (senderEmail) {
    rightY += 4;
    doc.text(`E-mail: ${senderEmail}`, hrX, rightY, { width: hrW, align: 'right' });
    rightY += 16;
  }

  // ── Header divider line ─────────────────────────────────────────────────────
  const headerBottom = Math.max(leftY, rightY, mottoY + 14) + 5;
  doc.moveTo(ML, headerBottom)
     .lineTo(PW - MR, headerBottom)
     .strokeColor('#999999')
     .lineWidth(0.5)
     .stroke();

  y = headerBottom + 15;

  // ══════════════════════════════════════════════════════════════════════════════
  //  TO / DATE ROW
  // ══════════════════════════════════════════════════════════════════════════════
  const toDateY = y;
  doc.font('Times-Roman').fontSize(14);
  doc.text('To,', ML, y);
  y += 18;
  doc.font('Times-Bold').fontSize(14);
  doc.text(`Shri ${letter.recipientName}`, ML, y);
  y += 18;
  doc.font('Times-Roman').fontSize(14);
  const recipientLines = (letter.recipientAddress || '').split('\n');
  for (const line of recipientLines) {
    if (line.trim()) {
      doc.text(line.trim(), ML, y, { width: CW * 0.6 });
      y += 16;
    }
  }

  // Date (right-aligned, same row as "To,")
  const dateStr = new Date(letter.date)
    .toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })
    .replace(/\//g, '-');
  doc.font('Times-Roman').fontSize(14);
  doc.text(`Date: ${dateStr}`, ML, toDateY, { width: CW, align: 'right' });

  y += 10;

  // ══════════════════════════════════════════════════════════════════════════════
  //  SUBJECT
  // ══════════════════════════════════════════════════════════════════════════════
  doc.font('Times-Bold').fontSize(14);
  doc.text(`Subject: ${letter.subject}`, ML, y, { width: CW });
  y = doc.y + 15;

  // ══════════════════════════════════════════════════════════════════════════════
  //  SALUTATION
  // ══════════════════════════════════════════════════════════════════════════════
  doc.font('Times-Roman').fontSize(14);
  doc.text('Sir,', ML, y);
  y = doc.y + 12;

  // ══════════════════════════════════════════════════════════════════════════════
  //  BODY
  // ══════════════════════════════════════════════════════════════════════════════
  doc.font('Times-Roman').fontSize(13);
  for (const paragraph of bodyParagraphs) {
    // Check if we need a new page
    const pHeight = doc.heightOfString(paragraph, { width: CW, align: 'justify', lineGap: 4 });
    if (y + pHeight > 841.89 - MB - 20) {
      doc.addPage();
      y = MT;
    }
    doc.text(paragraph, ML, y, { width: CW, align: 'justify', lineGap: 4 });
    y = doc.y + 12;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  //  FOOTER — signature + QR
  // ══════════════════════════════════════════════════════════════════════════════
  const footerHeight = 130;
  if (y + footerHeight > 841.89 - MB) {
    doc.addPage();
    y = MT;
  }

  y += 20;

  // Signature block
  doc.font('Times-Roman').fontSize(14);
  doc.text('Yours sincerely,', ML, y);
  y += 55; // space for signature
  doc.font('Times-Bold').fontSize(14);
  doc.text(senderName, ML, y);
  y += 18;
  doc.font('Times-Roman').fontSize(13);
  const sigTitle = designation + (organization ? `, ${organization}` : '');
  if (sigTitle) doc.text(sigTitle, ML, y);

  // QR code (right side, aligned with signature block)
  const qrSize = 70;
  const qrX = PW - MR - qrSize;
  const qrY = y - 55; // align with "Yours sincerely,"
  doc.image(qrPngBuffer, qrX, qrY, { width: qrSize, height: qrSize });
  doc.font('Helvetica').fontSize(8).fillColor('#666666');
  doc.text('Scan to Verify', qrX, qrY + qrSize + 3, { width: qrSize, align: 'center' });

  // ── Finalize ────────────────────────────────────────────────────────────────
  doc.end();

  return new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
};

import { Response, Request } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { generateLetterPDF } from '../lib/pdfGenerator';
import geoip from 'geoip-lite';
import requestIp from 'request-ip';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-local-dev';

export const createLetter = async (req: AuthRequest, res: Response): Promise<void> => {
  const { refNo, date, recipientName, recipientAddress, subject, body, signatureBlock, copyTo } = req.body;
  if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }

  try {
    const letterContent = JSON.stringify({
    refNo,
    date: new Date(date).toISOString(),
    recipientName,
    recipientAddress,
    subject,
    body,
    signatureBlock,
    copyTo
  });
    const hash = crypto.createHash('sha256').update(letterContent).digest('hex');
    const tempId = crypto.randomUUID();
    const qrToken = jwt.sign({ letterId: tempId, hash }, JWT_SECRET);

    const letter = await prisma.letter.create({
      data: {
        id: tempId,
        senderId: req.user.id,
        refNo,
        date: new Date(date),
        recipientName,
        recipientAddress,
        subject,
        body,
        signatureBlock,
        copyTo,
        hash,
        qrToken,
      },
    });

    res.status(201).json(letter);
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({ message: 'Reference Number already exists' });
      return;
    }
    console.error('Create letter error:', error);
    res.status(500).json({ message: 'Failed to create letter' });
  }
};

export const getLetters = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
  try {
    const letters = await prisma.letter.findMany({
      where: req.user.role === 'ADMIN' ? {} : { senderId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { name: true, role: true, designationType: true, houseType: true, constituency: true, state: true, defaultAddress: true, email: true } },
        _count: { select: { scanLogs: true } },
      },
    });
    res.json(letters);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch letters' });
  }
};

export const getLetterById = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params['id'] as string;
  try {
    const letter = await prisma.letter.findUnique({
      where: { id },
      include: {
        sender: { select: { name: true, role: true, designationType: true, houseType: true, constituency: true, state: true, defaultAddress: true, email: true } },
        scanLogs: { orderBy: { scannedAt: 'desc' }, take: 10 },
      },
    });
    if (!letter) { res.status(404).json({ message: 'Letter not found' }); return; }
    res.json(letter);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch letter details' });
  }
};

export const verifyLetter = async (req: Request & { app: any }, res: Response): Promise<void> => {
  const { token } = req.query;
  if (!token) { res.status(400).json({ message: 'Token is required' }); return; }

  try {
    const decoded = jwt.verify(token as string, JWT_SECRET) as any;
    const { letterId, hash: storedHash } = decoded;

    const letter = await prisma.letter.findUnique({
      where: { id: letterId },
      include: { sender: { select: { name: true, role: true, designationType: true, houseType: true, constituency: true, state: true, defaultAddress: true, email: true } } },
    });

    if (!letter) {
      res.status(404).json({ status: 'TAMPERED', message: 'Invalid token: Letter record not found' });
      return;
    }

    const letterContent = JSON.stringify({
      refNo: letter.refNo,
      date: new Date(letter.date).toISOString(),
      recipientName: letter.recipientName,
      recipientAddress: letter.recipientAddress,
      subject: letter.subject,
      body: letter.body,
      signatureBlock: letter.signatureBlock,
      copyTo: letter.copyTo,
    });

    const currentHash = crypto.createHash('sha256').update(letterContent).digest('hex');
    const isAuthentic = currentHash === storedHash && currentHash === letter.hash;

    // Log the scan
    const clientIp = requestIp.getClientIp(req);
    const geo = clientIp ? geoip.lookup(clientIp) : null;
    const location = geo ? `${geo.city}, ${geo.region}, ${geo.country}` : 'Unknown';
    const deviceInfo = req.headers['user-agent'] || 'Unknown';

    await prisma.scanLog.create({
      data: { letterId: letter.id, ipAddress: clientIp, location, deviceInfo },
    });

    // Real-time push notification
    const io = req.app.get('io');
    const scanCount = await prisma.scanLog.count({ where: { letterId: letter.id } });

    let notificationMessage = `Your letter (Ref: ${letter.refNo}) was just scanned.`;
    if (scanCount === 1) notificationMessage = `First scan detected: Your letter (Ref: ${letter.refNo}) has been read.`;
    else if (scanCount > 5) notificationMessage = `High activity: Multiple scans (${scanCount}) detected for letter ${letter.refNo}.`;

    const recentScans = await prisma.scanLog.findMany({
      where: { letterId: letter.id },
      orderBy: { scannedAt: 'desc' },
      take: 2,
    });
    if (recentScans.length > 1 && recentScans[0]!.location !== recentScans[1]!.location) {
      notificationMessage = `Suspicious activity: Scans from different locations for letter ${letter.refNo}.`;
    }

    io.to(letter.senderId).emit('notification', {
      type: scanCount === 1 ? 'INFO' : 'WARNING',
      message: notificationMessage,
      letterId: letter.id,
      timestamp: new Date(),
    });

    res.json({
      status: isAuthentic ? 'AUTHENTIC' : 'TAMPERED',
      letter: {
        refNo: letter.refNo,
        date: letter.date,
        recipientName: `Shri ${letter.recipientName}`,
        recipientAddress: letter.recipientAddress,
        subject: letter.subject,
        body: letter.body,
        signatureBlock: letter.signatureBlock,
        copyTo: letter.copyTo,
        senderName: `Shri ${letter.sender.name}`,
        senderRole: letter.sender.role,
        senderDesignation: letter.sender.designationType,
        senderHouseType: letter.sender.houseType,
        senderConstituency: letter.sender.constituency,
        senderState: letter.sender.state,
        createdAt: letter.createdAt,
      },
    });
  } catch (error) {
    res.status(400).json({ status: 'TAMPERED', message: 'Invalid or expired verification token' });
  }
};

export const getLetterPDF = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params['id'] as string;
  try {
    const letter = await prisma.letter.findUnique({
      where: { id },
      include: { sender: { select: { name: true, role: true, designationType: true, houseType: true, constituency: true, state: true, defaultAddress: true, email: true } } },
    });
    if (!letter) { res.status(404).json({ message: 'Letter not found' }); return; }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    console.log('[PDF] Using FRONTEND_URL:', frontendUrl);
    const pdfBuffer = await generateLetterPDF(letter, letter.qrToken, frontendUrl);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Letter_${letter.refNo.replace(/\//g, '_')}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF Generation Error:', error);
    res.status(500).json({ message: 'Failed to generate PDF' });
  }
};
export const deleteLetter = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params['id'] as string;
  if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }

  try {
    const letter = await prisma.letter.findUnique({
      where: { id },
    });

    if (!letter) {
      res.status(404).json({ message: 'Letter not found' });
      return;
    }

    if (req.user.role !== 'ADMIN' && letter.senderId !== req.user.id) {
      res.status(403).json({ message: 'You do not have permission to delete this letter' });
      return;
    }

    await prisma.letter.delete({
      where: { id },
    });

    res.json({ message: 'Letter deleted successfully' });
  } catch (error) {
    console.error('Delete letter error:', error);
    res.status(500).json({ message: 'Failed to delete letter' });
  }
};

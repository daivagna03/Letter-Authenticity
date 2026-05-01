import { Response, Request } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { generateLetterPDF } from '../lib/pdfGenerator';
import { generateId } from '../lib/generateId';
import geoip from 'geoip-lite';
import requestIp from 'request-ip';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-local-dev';

const SENDER_SELECT_FIELDS = {
  name: true,
  role: true,
  mode: true,
  designation: true,
  department: true,
  organization: true,
  employeeId: true,
  defaultAddress: true,
  email: true,
  // Political fields
  constituency: true,
  state: true,
  houseType: true,
  // Signature & Seal
  signatureUrl: true,
  sealUrl: true,
};

const DRAFTER_SELECT_FIELDS = {
  id: true,
  name: true,
  email: true,
  role: true,
  employeeId: true,
  designation: true,
  operatorRole: true,
};

/**
 * Standardizes letter content for consistent hashing between creation and verification.
 * Handles Date objects and null/undefined values to prevent false "Tampering Detected" flags.
 */
const getHashableContent = (data: {
  refNo: string;
  date: Date | string;
  recipientName: string;
  recipientAddress: string;
  subject: string;
  body: string;
  signatureBlock: string;
  copyTo?: string | null;
}) => {
  return JSON.stringify({
    refNo: data.refNo,
    date: new Date(data.date).toISOString(),
    recipientName: data.recipientName,
    recipientAddress: data.recipientAddress,
    subject: data.subject,
    body: data.body,
    signatureBlock: data.signatureBlock,
    copyTo: data.copyTo || '', // Standardize null/undefined/empty to empty string
  });
};

export const createLetter = async (req: AuthRequest, res: Response): Promise<void> => {
  const {
    refNo, date, recipientName, recipientAddress,
    recipientDesignation, recipientAddressDetail,
    subject, body, signatureBlock, copyTo,
    templateId,
    // MPLAD-specific
    mplaadTableData,
    // District Order specific
    memoNo, orderCopyList, districtOrgName, districtDeptName,
  } = req.body;

  if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }

  // senderId is always the main user account (the "owner" of the letter)
  const senderId = req.user.role === 'OPERATOR' && req.user.parentUserId
    ? req.user.parentUserId
    : req.user.id;

  const createdByType = req.user.role === 'OPERATOR' ? 'operator' : 'main_user';
  const creatorIp = requestIp.getClientIp(req);
  const geo = creatorIp ? geoip.lookup(creatorIp) : null;
  const creatorLocation = geo ? `${geo.city}, ${geo.region}, ${geo.country}` : 'Unknown';

  try {
    const letterContent = getHashableContent({
      refNo,
      date,
      recipientName,
      recipientAddress,
      subject,
      body,
      signatureBlock,
      copyTo,
    });
    const hash = crypto.createHash('sha256').update(letterContent).digest('hex');
    const tempId = generateId();
    const qrToken = jwt.sign({ letterId: tempId, hash }, JWT_SECRET);

    const letter = await prisma.letter.create({
      data: {
        id: tempId,
        senderId,
        draftedById: req.user.id,
        templateId: templateId || undefined,
        refNo,
        date: new Date(date),
        recipientName,
        recipientDesignation: recipientDesignation || undefined,
        recipientAddress: recipientAddress || '',
        recipientAddressDetail: recipientAddressDetail || undefined,
        subject,
        body,
        signatureBlock,
        copyTo,
        // Template-specific fields
        mplaadTableData: mplaadTableData ? JSON.stringify(mplaadTableData) : undefined,
        memoNo: memoNo || undefined,
        orderCopyList: orderCopyList ? JSON.stringify(orderCopyList) : undefined,
        districtOrgName: districtOrgName || undefined,
        districtDeptName: districtDeptName || undefined,
        hash,
        qrToken,
        createdByType,
        creatorIpAddress: creatorIp,
        creatorLocation,
      },
      include: {
        sender: { select: SENDER_SELECT_FIELDS },
        draftedBy: { select: DRAFTER_SELECT_FIELDS },
        template: { select: { id: true, name: true, slug: true } },
        _count: { select: { scanLogs: true } },
      }
    });

    // Fire-and-forget PDF generation
    setImmediate(async () => {
      try {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const pdfBuffer = await generateLetterPDF(letter, qrToken, frontendUrl);
        await prisma.letter.update({
          where: { id: letter.id },
          data: { pdfData: Buffer.from(pdfBuffer) },
        });
        console.log('[PDF] Background cache generated for:', letter.id);
      } catch (err) {
        console.error('[PDF] Background cache failed:', err);
      }
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

  // VISIBILITY RULES:
  // - MAIN_USER sees ALL letters where senderId = their id (includes operator-drafted letters)
  // - OPERATOR sees ONLY letters they personally drafted (draftedById = their id)
  // - ADMIN sees everything
  let whereClause: any;

  if (req.user.role === 'ADMIN') {
    whereClause = {};
  } else if (req.user.role === 'OPERATOR') {
    whereClause = { draftedById: req.user.id };
  } else {
    // MAIN_USER
    whereClause = { senderId: req.user.id };
  }

  try {
    const letters = await prisma.letter.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: SENDER_SELECT_FIELDS },
        draftedBy: { select: DRAFTER_SELECT_FIELDS },
        template: { select: { id: true, name: true, slug: true } },
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
        sender: { select: SENDER_SELECT_FIELDS },
        draftedBy: { select: DRAFTER_SELECT_FIELDS },
        template: { select: { id: true, name: true, slug: true } },
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
      include: {
        sender: { select: SENDER_SELECT_FIELDS },
        template: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!letter) {
      res.status(404).json({ status: 'TAMPERED', message: 'Invalid token: Letter record not found' });
      return;
    }

    const letterContent = getHashableContent({
      refNo: letter.refNo,
      date: letter.date,
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
    const scanGeo = clientIp ? geoip.lookup(clientIp) : null;
    const location = scanGeo ? `${scanGeo.city}, ${scanGeo.region}, ${scanGeo.country}` : 'Unknown';
    const deviceInfo = req.headers['user-agent'] || 'Unknown';

    await prisma.scanLog.create({
      data: { id: generateId(), letterId: letter.id, ipAddress: clientIp, location, deviceInfo },
    });

    // Real-time push notification
    const io = req.app.get('io');
    const scanCount = await prisma.scanLog.count({ where: { letterId: letter.id } });

    let notificationType: 'INFO' | 'WARNING' | 'CRITICAL' = 'INFO';
    let notificationMessage = `Your letter (Ref: ${letter.refNo}) was just scanned.`;

    if (scanCount === 1) {
      notificationMessage = `First scan detected: Your letter (Ref: ${letter.refNo}) has been read.`;
      notificationType = 'INFO';
    } else {
      notificationType = 'WARNING';
    }
    
    if (scanCount > 5) {
      notificationMessage = `High activity: Multiple scans (${scanCount}) detected for letter ${letter.refNo}.`;
      notificationType = 'WARNING';
    }

    const recentScans = await prisma.scanLog.findMany({
      where: { letterId: letter.id },
      orderBy: { scannedAt: 'desc' },
      take: 2,
    });
    if (recentScans.length > 1 && recentScans[0]!.location !== recentScans[1]!.location) {
      notificationMessage = `Suspicious activity: Scans from different locations for letter ${letter.refNo}.`;
      notificationType = 'CRITICAL';
    }

    if (!isAuthentic) {
      notificationMessage = `CRITICAL: Tampering detected for letter ${letter.refNo}! The digital signature does not match.`;
      notificationType = 'CRITICAL';
    }

    const payload = {
      type: notificationType,
      message: notificationMessage,
      letterId: letter.id,
      timestamp: new Date(),
    };

    // Notify the main user account
    io.to(letter.senderId).emit('notification', payload);

    // Notify the operator who drafted the letter (if different from main user)
    if (letter.draftedById && letter.draftedById !== letter.senderId) {
      io.to(letter.draftedById).emit('notification', payload);
    }

    res.json({
      status: isAuthentic ? 'AUTHENTIC' : 'TAMPERED',
      letter: {
        refNo: letter.refNo,
        date: letter.date,
        recipientName: letter.recipientName,
        recipientAddress: letter.recipientAddress,
        subject: letter.subject,
        body: letter.body,
        signatureBlock: letter.signatureBlock,
        copyTo: letter.copyTo,
        senderName: letter.sender.name,
        senderRole: letter.sender.role,
        senderDesignation: letter.sender.designation,
        senderDepartment: letter.sender.department,
        senderOrganization: letter.sender.organization,
        templateSlug: letter.template?.slug,
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
      include: {
        sender: { select: SENDER_SELECT_FIELDS },
        template: { select: { id: true, name: true, slug: true } },
      },
    });
    if (!letter) { res.status(404).json({ message: 'Letter not found' }); return; }

    const filename = `Letter_${letter.refNo.replace(/\//g, '_')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

    if (letter.pdfData && letter.pdfData.length > 0) {
      console.log('[PDF] Serving cached PDF for letter:', id);
      res.send(letter.pdfData);
      return;
    }

    console.log('[PDF] No cached PDF found, generating on-demand for letter:', id);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const pdfBuffer = await generateLetterPDF(letter, letter.qrToken, frontendUrl);

    await prisma.letter.update({
      where: { id },
      data: { pdfData: Buffer.from(pdfBuffer) },
    });

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
    const letter = await prisma.letter.findUnique({ where: { id } });

    if (!letter) {
      res.status(404).json({ message: 'Letter not found' });
      return;
    }

    if (req.user.role === 'ADMIN') {
      // Admin can delete anything
    } else if (req.user.role === 'OPERATOR') {
      // Operator can only delete their own drafted letters
      if (letter.draftedById !== req.user.id) {
        res.status(403).json({ message: 'You can only delete letters you created' });
        return;
      }
    } else {
      // Main user can delete any letter under their account
      if (letter.senderId !== req.user.id) {
        res.status(403).json({ message: 'You do not have permission to delete this letter' });
        return;
      }
    }

    await prisma.letter.delete({ where: { id } });
    res.json({ message: 'Letter deleted successfully' });
  } catch (error) {
    console.error('Delete letter error:', error);
    res.status(500).json({ message: 'Failed to delete letter' });
  }
};

export const getAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }

  // For analytics, always show statistics for the main user account
  const targetUserId = req.user.role === 'OPERATOR' && req.user.parentUserId
    ? req.user.parentUserId
    : req.user.id;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const lettersToday = await prisma.letter.count({
      where: { senderId: targetUserId, createdAt: { gte: today } }
    });

    const lettersYesterday = await prisma.letter.count({
      where: { senderId: targetUserId, createdAt: { gte: yesterday, lt: today } }
    });

    const recentLetters = await prisma.letter.findMany({
      where: { senderId: targetUserId, createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true }
    });

    const dailyCounts: Record<string, number> = {};
    recentLetters.forEach(letter => {
      const dateStr = letter.createdAt.toISOString().split('T')[0];
      if (dateStr) {
        dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
      }
    });

    res.json({
      todayCount: lettersToday,
      yesterdayCount: lettersYesterday,
      calendarData: Object.entries(dailyCounts).map(([date, count]) => ({ date, count }))
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
};

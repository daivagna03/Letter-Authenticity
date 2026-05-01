import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { Role, Mode } from '@prisma/client';
import { generateId } from '../lib/generateId';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-local-dev';

const USER_SELECT_FIELDS = {
  id: true,
  name: true,
  email: true,
  role: true,
  employeeId: true,
  isActive: true,
  mode: true,
  // Organization fields
  designation: true,
  department: true,
  organization: true,
  defaultAddress: true,
  // Political fields
  constituency: true,
  state: true,
  houseType: true,
  // Signature & Seal
  signatureUrl: true,
  sealUrl: true,
  // Operator fields
  operatorRole: true,
  parentUserId: true,
  createdAt: true,
};

export const register = async (req: Request, res: Response): Promise<void> => {
  const {
    name, email, password, employeeId,
    mode,
    // Organization mode fields
    designation, department, organization, defaultAddress,
    // Political mode fields
    constituency, state, houseType,
  } = req.body;

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          ...(employeeId ? [{ employeeId: employeeId }] : [])
        ]
      }
    });

    if (existingUser) {
      res.status(400).json({ message: 'User with this email or Employee ID already exists' });
      return;
    }

    const userMode: Mode = mode === 'POLITICAL' ? Mode.POLITICAL : Mode.ORGANIZATION;
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        id: generateId(),
        name,
        email,
        employeeId: employeeId || undefined,
        passwordHash,
        role: Role.MAIN_USER,
        mode: userMode,
        // Organization fields
        ...(designation && { designation }),
        ...(department && { department }),
        ...(organization && { organization }),
        ...(defaultAddress && { defaultAddress }),
        // Political fields
        ...(constituency && { constituency }),
        ...(state && { state }),
        ...(houseType && { houseType }),
      },
      select: USER_SELECT_FIELDS,
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, mode: user.mode, parentUserId: null },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ token, user });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { employeeId: email }
        ]
      }
    });
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ message: 'Your account has been disabled. Please contact your administrator.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, mode: user.mode, parentUserId: user.parentUserId },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        isActive: user.isActive,
        mode: user.mode,
        // Organization fields
        designation: user.designation,
        department: user.department,
        organization: user.organization,
        defaultAddress: user.defaultAddress,
        // Political fields
        constituency: user.constituency,
        state: user.state,
        houseType: user.houseType,
        // Signature & Seal
        signatureUrl: user.signatureUrl,
        sealUrl: user.sealUrl,
        // Operator
        operatorRole: user.operatorRole,
        parentUserId: user.parentUserId,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMe = async (req: Request & { user?: any }, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: USER_SELECT_FIELDS,
    });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }

  const {
    name, email, mode,
    designation, department, organization, defaultAddress,
    constituency, state, houseType,
    signatureUrl, sealUrl,
  } = req.body;

  try {
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(mode && { mode: mode as Mode }),
        ...(designation !== undefined && { designation }),
        ...(department !== undefined && { department }),
        ...(organization !== undefined && { organization }),
        ...(defaultAddress !== undefined && { defaultAddress }),
        ...(constituency !== undefined && { constituency }),
        ...(state !== undefined && { state }),
        ...(houseType !== undefined && { houseType }),
        ...(signatureUrl !== undefined && { signatureUrl }),
        ...(sealUrl !== undefined && { sealUrl }),
      },
      select: USER_SELECT_FIELDS,
    });
    res.json(updated);
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({ message: 'Email already in use by another account' });
      return;
    }
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

// ── Operator Management ────────────────────────────────────────────────────────

export const createOperator = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'MAIN_USER') {
    res.status(403).json({ message: 'Only main users can create operators' });
    return;
  }

  const { name, email, password, operatorRole } = req.body;

  try {
    const operatorCount = await prisma.user.count({
      where: { parentUserId: req.user.id },
    });

    if (operatorCount >= 3) {
      res.status(400).json({ message: 'Operator limit reached (max 3)' });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: 'User with this email already exists' });
      return;
    }

    // Get parent's mode so operator inherits it
    const parentUser = await prisma.user.findUnique({ where: { id: req.user.id } });

    const passwordHash = await bcrypt.hash(password, 10);
    const operator = await prisma.user.create({
      data: {
        id: generateId(),
        name,
        email,
        passwordHash,
        role: Role.OPERATOR,
        mode: parentUser?.mode ?? Mode.ORGANIZATION,
        parentUserId: req.user.id,
        ...(operatorRole && { operatorRole }),
      },
      select: USER_SELECT_FIELDS,
    });

    res.status(201).json(operator);
  } catch (error) {
    console.error('Create operator error:', error);
    res.status(500).json({ message: 'Failed to create operator' });
  }
};

export const getOperators = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'MAIN_USER') {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const operators = await prisma.user.findMany({
      where: { parentUserId: req.user.id },
      select: USER_SELECT_FIELDS,
    });
    res.json(operators);
  } catch (error) {
    console.error('Get operators error:', error);
    res.status(500).json({ message: 'Failed to fetch operators' });
  }
};

export const toggleOperatorStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'MAIN_USER') {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }

  const operatorId = req.params['id'] as string;

  try {
    const operator = await prisma.user.findFirst({
      where: { id: operatorId, parentUserId: req.user.id },
    });

    if (!operator) {
      res.status(404).json({ message: 'Operator not found' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: operatorId },
      data: { isActive: !operator.isActive },
      select: USER_SELECT_FIELDS,
    });

    res.json(updated);
  } catch (error) {
    console.error('Toggle operator status error:', error);
    res.status(500).json({ message: 'Failed to toggle operator status' });
  }
};

export const deleteOperator = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'MAIN_USER') {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }

  const operatorId = req.params['id'] as string;

  try {
    const operator = await prisma.user.findFirst({
      where: { id: operatorId, parentUserId: req.user.id },
    });

    if (!operator) {
      res.status(404).json({ message: 'Operator not found' });
      return;
    }

    await prisma.user.delete({
      where: { id: operatorId },
    });

    res.json({ message: 'Operator deleted successfully' });
  } catch (error) {
    console.error('Delete operator error:', error);
    res.status(500).json({ message: 'Failed to delete operator' });
  }
};

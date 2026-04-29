import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { Role, AccountType } from '@prisma/client';
import { generateId } from '../lib/generateId';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-local-dev';

const USER_SELECT_FIELDS = {
  id: true,
  name: true,
  email: true,
  role: true,
  accountType: true,
  employeeId: true,
  isActive: true,
  // Principal details
  principalName: true,
  principalDesignation: true,
  principalOrganization: true,
  principalAddress: true,
  principalSignatureUrl: true,
  principalSealUrl: true,
  // Assistant details
  assistantName: true,
  assistantRole: true,
  assistantContact: true,
  // Legacy / Regular fields
  designation: true,
  department: true,
  organization: true,
  defaultAddress: true,
  // Operator fields
  operatorRole: true,
  parentUserId: true,
  createdAt: true,
};

export const register = async (req: Request, res: Response): Promise<void> => {
  const {
    name, email, password, employeeId,
    accountType,
    // Regular account fields
    designation, department, organization,
    // Assistant account fields
    assistantName, assistantRole, assistantContact,
    principalName, principalDesignation, principalOrganization, principalAddress,
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

    const isAssistant = accountType === 'ASSISTANT';

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        id: generateId(),
        name,
        email,
        employeeId,
        passwordHash,
        role: Role.PRIMARY,
        accountType: isAssistant ? AccountType.ASSISTANT : AccountType.REGULAR,
        // Regular fields
        ...(designation && { designation }),
        ...(department && { department }),
        ...(organization && { organization }),
        // Assistant fields
        ...(isAssistant && assistantName && { assistantName }),
        ...(isAssistant && assistantRole && { assistantRole }),
        ...(isAssistant && assistantContact && { assistantContact }),
        // Principal fields
        ...(isAssistant && principalName && { principalName }),
        ...(isAssistant && principalDesignation && { principalDesignation }),
        ...(isAssistant && principalOrganization && { principalOrganization }),
        ...(isAssistant && principalAddress && { principalAddress }),
      },
      select: USER_SELECT_FIELDS,
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, accountType: user.accountType, parentUserId: null },
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

    // Block disabled operators
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
      { id: user.id, email: user.email, role: user.role, accountType: user.accountType, parentUserId: user.parentUserId },
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
        accountType: user.accountType,
        employeeId: user.employeeId,
        isActive: user.isActive,
        // Principal details
        principalName: user.principalName,
        principalDesignation: user.principalDesignation,
        principalOrganization: user.principalOrganization,
        principalAddress: user.principalAddress,
        principalSignatureUrl: user.principalSignatureUrl,
        principalSealUrl: user.principalSealUrl,
        // Assistant details
        assistantName: user.assistantName,
        assistantRole: user.assistantRole,
        assistantContact: user.assistantContact,
        // Regular / legacy fields
        designation: user.designation,
        department: user.department,
        organization: user.organization,
        defaultAddress: user.defaultAddress,
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

  const { name, email, designation, department, organization, defaultAddress } = req.body;

  try {
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(designation !== undefined && { designation }),
        ...(department !== undefined && { department }),
        ...(organization !== undefined && { organization }),
        ...(defaultAddress !== undefined && { defaultAddress }),
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

// Update assistant details
export const updateAssistantDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }

  const { assistantName, assistantRole, assistantContact } = req.body;

  try {
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(assistantName !== undefined && { assistantName }),
        ...(assistantRole !== undefined && { assistantRole }),
        ...(assistantContact !== undefined && { assistantContact }),
      },
      select: USER_SELECT_FIELDS,
    });
    res.json(updated);
  } catch (error) {
    console.error('Update assistant details error:', error);
    res.status(500).json({ message: 'Failed to update assistant details' });
  }
};

// Update principal details
export const updatePrincipalDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }

  const { principalName, principalDesignation, principalOrganization, principalAddress, principalSignatureUrl, principalSealUrl } = req.body;

  try {
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(principalName !== undefined && { principalName }),
        ...(principalDesignation !== undefined && { principalDesignation }),
        ...(principalOrganization !== undefined && { principalOrganization }),
        ...(principalAddress !== undefined && { principalAddress }),
        ...(principalSignatureUrl !== undefined && { principalSignatureUrl }),
        ...(principalSealUrl !== undefined && { principalSealUrl }),
      },
      select: USER_SELECT_FIELDS,
    });
    res.json(updated);
  } catch (error) {
    console.error('Update principal details error:', error);
    res.status(500).json({ message: 'Failed to update principal details' });
  }
};

// Operator Management

export const createOperator = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'PRIMARY') {
    res.status(403).json({ message: 'Only primary users can create operators' });
    return;
  }

  const { name, email, password, operatorRole } = req.body;

  try {
    // Check limit
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

    const passwordHash = await bcrypt.hash(password, 10);
    const operator = await prisma.user.create({
      data: {
        id: generateId(),
        name,
        email,
        passwordHash,
        role: Role.OPERATOR,
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
  if (!req.user || req.user.role !== 'PRIMARY') {
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
  if (!req.user || req.user.role !== 'PRIMARY') {
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
  if (!req.user || req.user.role !== 'PRIMARY') {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }

  const operatorId = req.params['id'] as string;

  try {
    // Ensure operator belongs to this primary user
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

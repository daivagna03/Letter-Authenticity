import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-local-dev';

const USER_SELECT_FIELDS = {
  id: true,
  name: true,
  email: true,
  role: true,
  mlaMpId: true,
  designationType: true,
  houseType: true,
  constituency: true,
  state: true,
  defaultAddress: true,
  createdAt: true,
};
export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, mlaMpId, designationType } = req.body;
  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { mlaMpId: mlaMpId }
        ]
      }
    });

    if (existingUser) {
      res.status(400).json({ message: 'User with this email or ID already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        mlaMpId,
        passwordHash,
        designationType,
        role: designationType === 'Member of Parliament' ? 'MLA' : 'MLA', // Simplified for now, or use a map
      },
      select: USER_SELECT_FIELDS,
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body; // 'email' can now be email or mlaMpId
  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { mlaMpId: email }
        ]
      }
    });
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
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
        mlaMpId: user.mlaMpId,
        designationType: user.designationType,
        houseType: user.houseType,
        constituency: user.constituency,
        state: user.state,
        defaultAddress: user.defaultAddress,
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

  const { name, email, designationType, houseType, constituency, state, defaultAddress } = req.body;

  try {
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(designationType !== undefined && { designationType }),
        ...(houseType !== undefined && { houseType }),
        ...(constituency !== undefined && { constituency }),
        ...(state !== undefined && { state }),
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

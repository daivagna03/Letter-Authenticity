import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { Mode } from '@prisma/client';

export const getTemplates = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }

  // Filter templates by the user's mode
  const userMode = req.user.mode as Mode;

  try {
    const templates = await prisma.template.findMany({
      where: {
        isActive: true,
        OR: [
          { mode: userMode },
          { mode: null }
        ]
      },
      orderBy: { sortOrder: 'asc' },
    });
    res.json(templates);
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ message: 'Failed to fetch templates' });
  }
};

export const getTemplateById = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }

  const id = req.params['id'] as string;

  try {
    const template = await prisma.template.findUnique({ where: { id } });
    if (!template) {
      res.status(404).json({ message: 'Template not found' });
      return;
    }
    res.json(template);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch template' });
  }
};

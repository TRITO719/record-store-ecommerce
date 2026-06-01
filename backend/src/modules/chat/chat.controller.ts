import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { prisma } from '../../config/prisma';
import { chatService } from './chat.service';
import type { UserContext } from './chat.tools';

const resolveUserContext = async (authHeader?: string): Promise<UserContext> => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { userId: null, role: 'GUEST' };
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token as string, env.JWT_SECRET) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true },
    });
    if (!user) return { userId: null, role: 'GUEST' };
    return {
      userId: user.id,
      role: user.role === 'ADMIN' ? 'ADMIN' : 'USER',
    };
  } catch {
    return { userId: null, role: 'GUEST' };
  }
};

export const chatController = {
  handleChat: async (req: Request, res: Response) => {
    try {
      const { message, history, context } = req.body;

      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const userCtx = await resolveUserContext(req.headers.authorization);

      const { response, actions } = await chatService.generateResponse(
        message,
        history || [],
        context || {},
        userCtx,
      );
      res.json({ response, actions, role: userCtx.role });
    } catch (error: any) {
      console.error('Chat Controller Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },
};

import { Request, Response, NextFunction } from 'express';
import jwt = require('jsonwebtoken');
import { PublicUser } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'neighborhood_share_secret_key_2024';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export function generateToken(user: { id: string; role: string }): string {
  return jwt.sign(
    { id: user.id, role: user.role },
    JWT_SECRET as string,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any
  );
}

export function verifyToken(token: string): any {
  return jwt.verify(token, JWT_SECRET);
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    res.status(401).json({ success: false, message: '未提供认证令牌' });
    return;
  }

  try {
    const decoded = verifyToken(token);
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: '无效的认证令牌' });
  }
}

export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ success: false, message: '需要管理员权限' });
    return;
  }
  next();
}

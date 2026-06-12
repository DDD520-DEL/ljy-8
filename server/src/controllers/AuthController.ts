import { Request, Response } from 'express';
import { authService } from '../services/AuthService';
import { AuthRequest } from '../utils/auth';

export class AuthController {
  public async login(req: Request, res: Response): Promise<void> {
    try {
      const result = await authService.login(req.body);
      if (!result) {
        res.status(401).json({ success: false, message: '手机号/邮箱或密码错误' });
        return;
      }
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async register(req: Request, res: Response): Promise<void> {
    try {
      const result = await authService.register(req.body);
      if (!result) {
        res.status(400).json({ success: false, message: '注册失败' });
        return;
      }
      res.status(201).json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const profile = authService.getProfile(req.user.id);
      if (!profile) {
        res.status(404).json({ success: false, message: '用户不存在' });
        return;
      }
      res.json({ success: true, data: profile });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

export const authController = new AuthController();

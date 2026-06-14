import { Request, Response } from 'express';
import { userVerificationService } from '../services/UserVerificationService';
import { AuthRequest } from '../utils/auth';

export class UserVerificationController {
  public async getMyVerification(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const verification = userVerificationService.getMyVerification(req.user.id);
      res.json({ success: true, data: verification });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async submitVerification(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { realName, houseNumber } = req.body;
      if (!realName || !houseNumber) {
        res.status(400).json({ success: false, message: '真实姓名和门牌号不能为空' });
        return;
      }
      const verification = userVerificationService.submitVerification(
        req.user.id,
        realName,
        houseNumber
      );
      res.status(201).json({ success: true, data: verification, message: '认证申请已提交，请等待审核' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getVerificationList(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const status = req.query.status as any;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const result = userVerificationService.getVerificationList(status, page, pageSize);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getVerificationById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const verification = userVerificationService.getVerificationById(id);
      if (!verification) {
        res.status(404).json({ success: false, message: '认证申请不存在' });
        return;
      }
      res.json({ success: true, data: verification });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async reviewVerification(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { id } = req.params;
      const { status, rejectReason } = req.body;
      if (!status || !['approved', 'rejected'].includes(status)) {
        res.status(400).json({ success: false, message: '无效的审核状态' });
        return;
      }
      if (status === 'rejected' && !rejectReason) {
        res.status(400).json({ success: false, message: '拒绝时请填写拒绝原因' });
        return;
      }
      const result = userVerificationService.reviewVerification(
        id,
        req.user.id,
        status,
        rejectReason
      );
      if (!result) {
        res.status(404).json({ success: false, message: '认证申请不存在' });
        return;
      }
      res.json({ success: true, data: result, message: '审核完成' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

export const userVerificationController = new UserVerificationController();

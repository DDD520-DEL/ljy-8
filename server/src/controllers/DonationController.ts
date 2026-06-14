import { Request, Response } from 'express';
import { donationService } from '../services/DonationService';
import { AuthRequest } from '../utils/auth';
import { DonationFilterParams, DonationSortParams, DonationPaginationParams } from '../types';

export class DonationController {
  public async getDonations(req: Request, res: Response): Promise<void> {
    try {
      const {
        category,
        keyword,
        userNeighborhood,
        status,
        sortBy,
        sortOrder,
        page,
        pageSize,
      } = req.query;

      const filters: DonationFilterParams = {
        category: category as string | undefined,
        keyword: keyword as string | undefined,
        userNeighborhood: userNeighborhood as string | undefined,
        status: status as any,
      };

      const sort: DonationSortParams = {
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
      };

      const pagination: DonationPaginationParams = {
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
      };

      const result = donationService.getDonations(filters, sort, pagination);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getDonationById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const donation = donationService.getDonationById(id);
      if (!donation) {
        res.status(404).json({ success: false, message: '捐赠不存在' });
        return;
      }
      res.json({ success: true, data: donation });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getMyDonations(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const donations = donationService.getDonationsByDonor(req.user.id);
      res.json({ success: true, data: donations });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getMyApplications(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const donations = donationService.getDonationsByApplicant(req.user.id);
      res.json({ success: true, data: donations });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getMyReceivedDonations(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const donations = donationService.getDonationsByRecipient(req.user.id);
      res.json({ success: true, data: donations });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async createDonation(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { itemId, donorNotes } = req.body;
      if (!itemId) {
        res.status(400).json({ success: false, message: '请选择要捐赠的物品' });
        return;
      }
      const donation = donationService.createDonation(req.user.id, itemId, donorNotes);
      if (!donation) {
        res.status(400).json({ success: false, message: '创建捐赠失败' });
        return;
      }
      res.status(201).json({ success: true, data: donation });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async applyForDonation(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { id } = req.params;
      const donation = donationService.applyForDonation(req.user.id, id);
      if (!donation) {
        res.status(400).json({ success: false, message: '申请失败' });
        return;
      }
      res.json({ success: true, data: donation });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async approveApplicant(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { id } = req.params;
      const { recipientId, meetLocation, meetTime } = req.body;
      if (!recipientId || !meetLocation || !meetTime) {
        res.status(400).json({ success: false, message: '请填写完整信息' });
        return;
      }
      const donation = donationService.approveApplicant(
        req.user.id,
        id,
        recipientId,
        meetLocation,
        meetTime
      );
      if (!donation) {
        res.status(400).json({ success: false, message: '确认失败' });
        return;
      }
      res.json({ success: true, data: donation });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async startMeeting(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { id } = req.params;
      const donation = donationService.startMeeting(req.user.id, id);
      if (!donation) {
        res.status(400).json({ success: false, message: '操作失败' });
        return;
      }
      res.json({ success: true, data: donation });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async completeDonation(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { id } = req.params;
      const donation = donationService.completeDonation(req.user.id, id);
      if (!donation) {
        res.status(400).json({ success: false, message: '操作失败' });
        return;
      }
      res.json({ success: true, data: donation });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async cancelDonation(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { id } = req.params;
      const { reason } = req.body;
      const donation = donationService.cancelDonation(req.user.id, id, reason);
      if (!donation) {
        res.status(400).json({ success: false, message: '取消失败' });
        return;
      }
      res.json({ success: true, data: donation });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async cancelApplication(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { id } = req.params;
      const donation = donationService.cancelApplication(req.user.id, id);
      if (!donation) {
        res.status(400).json({ success: false, message: '取消失败' });
        return;
      }
      res.json({ success: true, data: donation });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

export const donationController = new DonationController();

import { Response } from 'express';
import { greetingCardService } from '../services/GreetingCardService';
import { AuthRequest } from '../utils/auth';
import { GreetingCardTemplateCategory } from '../types';

export class GreetingCardController {
  public async getTemplates(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { category } = req.query;
      const templates = greetingCardService.getTemplates(
        category as GreetingCardTemplateCategory | undefined
      );
      res.json({ success: true, data: templates });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getReceivedCards(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const cards = greetingCardService.getReceivedCards(req.user.id);
      res.json({ success: true, data: cards });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getSentCards(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const cards = greetingCardService.getSentCards(req.user.id);
      res.json({ success: true, data: cards });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getCardById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const card = greetingCardService.getCardById(id);
      if (!card) {
        res.status(404).json({ success: false, message: '卡片不存在' });
        return;
      }
      res.json({ success: true, data: card });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async sendCard(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { receiverId, templateId, customMessage, orderId, orderType } = req.body;

      if (!receiverId || !templateId) {
        res.status(400).json({ success: false, message: '缺少必要参数' });
        return;
      }

      const card = greetingCardService.sendCard({
        senderId: req.user.id,
        receiverId,
        templateId,
        customMessage,
        orderId,
        orderType,
      });

      res.status(201).json({ success: true, data: card });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const stats = {
        received: greetingCardService.getReceivedCount(req.user.id),
        sent: greetingCardService.getSentCount(req.user.id),
      };
      res.json({ success: true, data: stats });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async checkHasSentForOrder(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { orderId } = req.params;
      const hasSent = greetingCardService.hasSentCardForOrder(orderId, req.user.id);
      res.json({ success: true, data: { hasSent } });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

export const greetingCardController = new GreetingCardController();

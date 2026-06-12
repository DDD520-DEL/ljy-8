import { Request, Response } from 'express';
import { skillService } from '../services/SkillService';
import { AuthRequest } from '../utils/auth';

export class SkillController {
  public async getSkills(req: Request, res: Response): Promise<void> {
    try {
      const { category, keyword } = req.query;
      const skills = skillService.getSkills(
        category as string | undefined,
        keyword as string | undefined
      );
      res.json({ success: true, data: skills });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getSkillById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const skill = skillService.getSkillById(id);
      if (!skill) {
        res.status(404).json({ success: false, message: '技能服务不存在' });
        return;
      }
      res.json({ success: true, data: skill });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async createSkill(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const skill = skillService.createSkill(req.user.id, req.body);
      res.status(201).json({ success: true, data: skill });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async updateSkill(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { id } = req.params;
      const skill = skillService.updateSkill(id, req.user.id, req.body);
      if (!skill) {
        res.status(404).json({ success: false, message: '技能服务不存在或无权限修改' });
        return;
      }
      res.json({ success: true, data: skill });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getMySkills(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const skills = skillService.getSkillsByProvider(req.user.id);
      res.json({ success: true, data: skills });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

export const skillController = new SkillController();

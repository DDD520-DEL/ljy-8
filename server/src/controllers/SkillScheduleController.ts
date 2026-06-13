import { Request, Response } from 'express';
import { skillScheduleService } from '../services/SkillScheduleService';
import { AuthRequest } from '../utils/auth';

export class SkillScheduleController {
  public async getSchedules(req: Request, res: Response): Promise<void> {
    try {
      const { skillId } = req.params;
      const schedules = skillScheduleService.getWeeklySchedules(skillId);
      res.json({ success: true, data: schedules });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getAvailableSlots(req: Request, res: Response): Promise<void> {
    try {
      const { skillId } = req.params;
      const { date } = req.query;
      
      if (date) {
        const slots = skillScheduleService.getAvailableSlots(skillId, date as string);
        res.json({ success: true, data: { date, availableSlots: slots } });
      } else {
        const weeklySlots = skillScheduleService.getWeeklyAvailableSlots(skillId);
        res.json({ success: true, data: weeklySlots });
      }
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async setSchedule(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { skillId } = req.params;
      const { date, timeSlots } = req.body;
      
      const schedule = skillScheduleService.setSchedule(req.user.id, skillId, date, timeSlots);
      res.json({ success: true, data: schedule });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async batchSetSchedule(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }
      const { skillId } = req.params;
      const { schedules } = req.body;
      
      const result = skillScheduleService.batchSetSchedule(req.user.id, skillId, schedules);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async checkConflict(req: Request, res: Response): Promise<void> {
    try {
      const { skillId } = req.params;
      const { date, startTime, endTime } = req.query;
      
      const hasConflict = skillScheduleService.checkTimeSlotConflict(
        skillId,
        date as string,
        startTime as string,
        endTime as string
      );
      
      res.json({ success: true, data: { hasConflict } });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

export const skillScheduleController = new SkillScheduleController();

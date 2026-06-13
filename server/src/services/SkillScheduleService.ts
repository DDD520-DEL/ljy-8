import { skillScheduleRepository } from '../repositories/SkillScheduleRepository';
import { skillRepository } from '../repositories/SkillRepository';
import { orderRepository } from '../repositories/OrderRepository';
import { SkillSchedule, TimeSlot, ServiceOrderStatus } from '../types';

export class SkillScheduleService {
  public getSchedulesBySkill(skillId: string): SkillSchedule[] {
    return skillScheduleRepository.findBySkillId(skillId);
  }

  public getScheduleByDate(skillId: string, date: string): SkillSchedule | undefined {
    return skillScheduleRepository.findBySkillIdAndDate(skillId, date);
  }

  public getWeeklySchedules(skillId: string): SkillSchedule[] {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    const startDate = this.formatDate(today);
    const endDate = this.formatDate(nextWeek);
    
    return skillScheduleRepository.findBySkillIdAndDateRange(skillId, startDate, endDate);
  }

  public getAvailableSlots(skillId: string, date: string): TimeSlot[] {
    const schedule = skillScheduleRepository.findBySkillIdAndDate(skillId, date);
    if (!schedule || schedule.timeSlots.length === 0) {
      return [];
    }

    const orders = orderRepository.findServiceOrdersBySkillId(skillId);
    const activeStatuses: ServiceOrderStatus[] = ['pending', 'approved', 'in_progress'];
    const dayOrders = orders.filter(order => {
      const orderDate = order.serviceDate.split('T')[0];
      return orderDate === date && activeStatuses.includes(order.status);
    });

    const bookedSlots = dayOrders.map(order => ({
      startTime: order.serviceStartTime,
      endTime: order.serviceEndTime,
    }));

    const availableSlots: TimeSlot[] = [];
    for (const slot of schedule.timeSlots) {
      const isAvailable = !bookedSlots.some(booked => 
        this.isTimeOverlap(slot.startTime, slot.endTime, booked.startTime, booked.endTime)
      );
      if (isAvailable) {
        availableSlots.push(slot);
      }
    }

    return availableSlots;
  }

  public getWeeklyAvailableSlots(skillId: string): { date: string; timeSlots: TimeSlot[]; availableSlots: TimeSlot[] }[] {
    const result: { date: string; timeSlots: TimeSlot[]; availableSlots: TimeSlot[] }[] = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = this.formatDate(date);
      
      const schedule = skillScheduleRepository.findBySkillIdAndDate(skillId, dateStr);
      const availableSlots = this.getAvailableSlots(skillId, dateStr);
      
      result.push({
        date: dateStr,
        timeSlots: schedule?.timeSlots || [],
        availableSlots,
      });
    }

    return result;
  }

  public setSchedule(providerId: string, skillId: string, date: string, timeSlots: { startTime: string; endTime: string }[]): SkillSchedule | null {
    const skill = skillRepository.findById(skillId);
    if (!skill) {
      throw new Error('技能服务不存在');
    }
    if (skill.providerId !== providerId) {
      throw new Error('无权设置该技能的排期');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    if (targetDate < today) {
      throw new Error('不能设置过去日期的排期');
    }

    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 7);
    if (targetDate > maxDate) {
      throw new Error('只能设置未来7天内的排期');
    }

    if (timeSlots.length === 0) {
      skillScheduleRepository.deleteBySkillIdAndDate(skillId, date);
      return null;
    }

    timeSlots.forEach(slot => {
      if (!this.isValidTimeFormat(slot.startTime) || !this.isValidTimeFormat(slot.endTime)) {
        throw new Error('时间格式不正确，应为 HH:mm 格式');
      }
      if (slot.startTime >= slot.endTime) {
        throw new Error('开始时间必须早于结束时间');
      }
    });

    const sortedSlots = [...timeSlots].sort((a, b) => a.startTime.localeCompare(b.startTime));
    for (let i = 0; i < sortedSlots.length - 1; i++) {
      if (sortedSlots[i].endTime > sortedSlots[i + 1].startTime) {
        throw new Error('时间段之间存在重叠');
      }
    }

    return skillScheduleRepository.upsert(skillId, date, timeSlots);
  }

  public batchSetSchedule(providerId: string, skillId: string, schedules: { date: string; timeSlots: { startTime: string; endTime: string }[] }[]): SkillSchedule[] {
    const skill = skillRepository.findById(skillId);
    if (!skill) {
      throw new Error('技能服务不存在');
    }
    if (skill.providerId !== providerId) {
      throw new Error('无权设置该技能的排期');
    }

    const results: SkillSchedule[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 7);

    for (const sched of schedules) {
      const targetDate = new Date(sched.date);
      if (targetDate < today || targetDate > maxDate) {
        continue;
      }

      if (sched.timeSlots.length === 0) {
        skillScheduleRepository.deleteBySkillIdAndDate(skillId, sched.date);
        continue;
      }

      try {
        sched.timeSlots.forEach(slot => {
          if (!this.isValidTimeFormat(slot.startTime) || !this.isValidTimeFormat(slot.endTime)) {
            throw new Error('时间格式不正确');
          }
          if (slot.startTime >= slot.endTime) {
            throw new Error('开始时间必须早于结束时间');
          }
        });

        const sortedSlots = [...sched.timeSlots].sort((a, b) => a.startTime.localeCompare(b.startTime));
        for (let i = 0; i < sortedSlots.length - 1; i++) {
          if (sortedSlots[i].endTime > sortedSlots[i + 1].startTime) {
            throw new Error('时间段之间存在重叠');
          }
        }

        const result = skillScheduleRepository.upsert(skillId, sched.date, sched.timeSlots);
        results.push(result);
      } catch (e) {
        continue;
      }
    }

    return results;
  }

  public checkTimeSlotConflict(skillId: string, date: string, startTime: string, endTime: string): boolean {
    const schedule = skillScheduleRepository.findBySkillIdAndDate(skillId, date);
    if (!schedule || schedule.timeSlots.length === 0) {
      return true;
    }

    const isInAvailableSlot = schedule.timeSlots.some(slot => 
      startTime >= slot.startTime && endTime <= slot.endTime
    );
    if (!isInAvailableSlot) {
      return true;
    }

    const orders = orderRepository.findServiceOrdersBySkillId(skillId);
    const activeStatuses: ServiceOrderStatus[] = ['pending', 'approved', 'in_progress'];
    const dayOrders = orders.filter(order => {
      const orderDate = order.serviceDate.split('T')[0];
      return orderDate === date && activeStatuses.includes(order.status);
    });

    return dayOrders.some(order => 
      this.isTimeOverlap(startTime, endTime, order.serviceStartTime, order.serviceEndTime)
    );
  }

  private isTimeOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    return start1 < end2 && end1 > start2;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private isValidTimeFormat(time: string): boolean {
    const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(time);
  }
}

export const skillScheduleService = new SkillScheduleService();

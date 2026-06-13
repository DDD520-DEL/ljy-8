import { db } from '../utils/db';
import { SkillSchedule, TimeSlot } from '../types';
import { generateId, getCurrentTime } from '../utils/helpers';

export class SkillScheduleRepository {
  private collection = 'skillSchedules';

  public findAll(): SkillSchedule[] {
    return db.getAll<SkillSchedule>(this.collection);
  }

  public findById(id: string): SkillSchedule | undefined {
    return db.getById<SkillSchedule>(this.collection, id);
  }

  public findBySkillId(skillId: string): SkillSchedule[] {
    return db.findMany<SkillSchedule>(this.collection, (schedule) => schedule.skillId === skillId);
  }

  public findBySkillIdAndDate(skillId: string, date: string): SkillSchedule | undefined {
    return db.findOne<SkillSchedule>(this.collection, (schedule) => schedule.skillId === skillId && schedule.date === date);
  }

  public findBySkillIdAndDateRange(skillId: string, startDate: string, endDate: string): SkillSchedule[] {
    return db.findMany<SkillSchedule>(this.collection, (schedule) => 
      schedule.skillId === skillId && schedule.date >= startDate && schedule.date <= endDate
    );
  }

  public create(scheduleData: Omit<SkillSchedule, 'id' | 'createdAt' | 'timeSlots'> & { timeSlots: { startTime: string; endTime: string }[] }): SkillSchedule {
    const timeSlots: TimeSlot[] = scheduleData.timeSlots.map(slot => ({
      id: generateId(),
      startTime: slot.startTime,
      endTime: slot.endTime,
    }));

    const schedule: SkillSchedule = {
      id: generateId(),
      skillId: scheduleData.skillId,
      date: scheduleData.date,
      timeSlots,
      createdAt: getCurrentTime(),
    };
    return db.insert<SkillSchedule>(this.collection, schedule);
  }

  public update(id: string, updates: Partial<SkillSchedule>): SkillSchedule | undefined {
    return db.update<SkillSchedule>(this.collection, id, updates);
  }

  public upsert(skillId: string, date: string, timeSlots: { startTime: string; endTime: string }[]): SkillSchedule {
    const existing = this.findBySkillIdAndDate(skillId, date);
    const slots: TimeSlot[] = timeSlots.map(slot => ({
      id: generateId(),
      startTime: slot.startTime,
      endTime: slot.endTime,
    }));

    if (existing) {
      const updated = this.update(existing.id, { timeSlots: slots });
      return updated!;
    } else {
      return this.create({ skillId, date, timeSlots });
    }
  }

  public delete(id: string): boolean {
    return db.delete(this.collection, id);
  }

  public deleteBySkillIdAndDate(skillId: string, date: string): boolean {
    const schedule = this.findBySkillIdAndDate(skillId, date);
    if (schedule) {
      return this.delete(schedule.id);
    }
    return false;
  }
}

export const skillScheduleRepository = new SkillScheduleRepository();

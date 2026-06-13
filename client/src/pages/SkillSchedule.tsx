import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { skillApi } from '../api';
import type { SkillWithProvider, TimeSlot, DailyAvailableSlots } from '../types';

interface TimeSlotInput {
  id: string;
  startTime: string;
  endTime: string;
}

function SkillSchedule() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [skill, setSkill] = useState<SkillWithProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [weeklySchedule, setWeeklySchedule] = useState<{ date: string; weekday: string; timeSlots: TimeSlotInput[] }[]>([]);
  const [error, setError] = useState('');

  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  useEffect(() => {
    if (id) {
      loadSkillAndSchedule();
    }
  }, [id]);

  const loadSkillAndSchedule = async () => {
    setLoading(true);
    try {
      const skillRes = await skillApi.getSkillById(id!);
      if (skillRes.success) {
        setSkill(skillRes.data);
      }

      const scheduleRes = await skillApi.getAvailableSlots(id!);
      if (scheduleRes.success) {
        const data = scheduleRes.data as DailyAvailableSlots[];
        const schedule = data.map((day) => {
          const date = new Date(day.date);
          return {
            date: day.date,
            weekday: weekdays[date.getDay()],
            timeSlots: day.timeSlots.map((slot) => ({
              id: slot.id,
              startTime: slot.startTime,
              endTime: slot.endTime,
            })),
          };
        });
        setWeeklySchedule(schedule);
      }
    } finally {
      setLoading(false);
    }
  };

  const addTimeSlot = (dateIndex: number) => {
    const newSchedule = [...weeklySchedule];
    newSchedule[dateIndex].timeSlots.push({
      id: `temp-${Date.now()}`,
      startTime: '09:00',
      endTime: '10:00',
    });
    setWeeklySchedule(newSchedule);
  };

  const removeTimeSlot = (dateIndex: number, slotIndex: number) => {
    const newSchedule = [...weeklySchedule];
    newSchedule[dateIndex].timeSlots.splice(slotIndex, 1);
    setWeeklySchedule(newSchedule);
  };

  const updateTimeSlot = (dateIndex: number, slotIndex: number, field: 'startTime' | 'endTime', value: string) => {
    const newSchedule = [...weeklySchedule];
    newSchedule[dateIndex].timeSlots[slotIndex][field] = value;
    setWeeklySchedule(newSchedule);
  };

  const validateSchedule = (): boolean => {
    for (const day of weeklySchedule) {
      const slots = day.timeSlots;
      for (let i = 0; i < slots.length; i++) {
        if (slots[i].startTime >= slots[i].endTime) {
          setError(`${day.weekday} 的第 ${i + 1} 个时段开始时间必须早于结束时间`);
          return false;
        }
      }

      const sortedSlots = [...slots].sort((a, b) => a.startTime.localeCompare(b.startTime));
      for (let i = 0; i < sortedSlots.length - 1; i++) {
        if (sortedSlots[i].endTime > sortedSlots[i + 1].startTime) {
          setError(`${day.weekday} 的时段存在重叠`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSave = async () => {
    setError('');
    if (!validateSchedule()) {
      return;
    }

    setSaving(true);
    try {
      const schedules = weeklySchedule.map((day) => ({
        date: day.date,
        timeSlots: day.timeSlots.map((slot) => ({
          startTime: slot.startTime,
          endTime: slot.endTime,
        })),
      }));

      const res = await skillApi.batchSetSchedule(id!, { schedules });
      if (res.success) {
        alert('排期保存成功！');
        loadSkillAndSchedule();
      } else {
        setError(res.message || '保存失败');
      }
    } catch (err: any) {
      setError(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const copyPreviousDay = (dateIndex: number) => {
    if (dateIndex === 0) return;
    const newSchedule = [...weeklySchedule];
    newSchedule[dateIndex].timeSlots = newSchedule[dateIndex - 1].timeSlots.map((slot) => ({
      ...slot,
      id: `temp-${Date.now()}-${Math.random()}`,
    }));
    setWeeklySchedule(newSchedule);
  };

  const clearDay = (dateIndex: number) => {
    const newSchedule = [...weeklySchedule];
    newSchedule[dateIndex].timeSlots = [];
    setWeeklySchedule(newSchedule);
  };

  if (loading) {
    return <div className="container">加载中...</div>;
  }

  if (!skill) {
    return <div className="container">技能服务不存在</div>;
  }

  return (
    <div className="container skill-schedule-page">
      <div className="breadcrumb">
        <Link to="/skills">技能交换</Link> / <Link to={`/skills/${skill.id}`}>{skill.title}</Link> / <span>排期管理</span>
      </div>

      <div className="page-header">
        <h1>服务排期管理</h1>
        <p className="text-muted">设置未来7天的可服务时间段</p>
      </div>

      <div className="skill-info-card">
        <h3>{skill.title}</h3>
        <p className="text-muted">服务时长：{skill.serviceDuration} 分钟 | 价格：{skill.timeCoinPrice} 时间币</p>
      </div>

      {error && <div className="error-alert">{error}</div>}

      <div className="schedule-grid">
        {weeklySchedule.map((day, dayIndex) => (
          <div key={day.date} className="schedule-day-card">
            <div className="day-header">
              <div className="day-info">
                <span className="weekday">{day.weekday}</span>
                <span className="date">{day.date.slice(5)}</span>
              </div>
              <div className="day-actions">
                {dayIndex > 0 && (
                  <button className="btn-icon" onClick={() => copyPreviousDay(dayIndex)} title="复制前一天">
                    📋
                  </button>
                )}
                <button className="btn-icon" onClick={() => clearDay(dayIndex)} title="清空当天">
                  🗑️
                </button>
              </div>
            </div>

            <div className="time-slots-list">
              {day.timeSlots.length === 0 ? (
                <div className="empty-slots">
                  <p>无可服务时段</p>
                </div>
              ) : (
                day.timeSlots.map((slot, slotIndex) => (
                  <div key={slot.id} className="time-slot-item">
                    <input
                      type="time"
                      className="time-input"
                      value={slot.startTime}
                      onChange={(e) => updateTimeSlot(dayIndex, slotIndex, 'startTime', e.target.value)}
                    />
                    <span className="time-separator">—</span>
                    <input
                      type="time"
                      className="time-input"
                      value={slot.endTime}
                      onChange={(e) => updateTimeSlot(dayIndex, slotIndex, 'endTime', e.target.value)}
                    />
                    <button
                      className="btn-remove-slot"
                      onClick={() => removeTimeSlot(dayIndex, slotIndex)}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>

            <button className="btn-add-slot" onClick={() => addTimeSlot(dayIndex)}>
              + 添加时段
            </button>
          </div>
        ))}
      </div>

      <div className="actions-bar">
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          返回
        </button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? '保存中...' : '保存排期'}
        </button>
      </div>

      <style>{`
        .skill-schedule-page {
          padding-top: 0;
          max-width: 1200px;
          margin: 0 auto;
        }
        .breadcrumb {
          margin-bottom: 20px;
          color: #999;
          font-size: 14px;
        }
        .breadcrumb a {
          color: #667eea;
        }
        .page-header {
          margin-bottom: 24px;
        }
        .page-header h1 {
          font-size: 28px;
          margin-bottom: 8px;
        }
        .skill-info-card {
          background: white;
          border-radius: 12px;
          padding: 20px 24px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }
        .skill-info-card h3 {
          font-size: 18px;
          margin-bottom: 8px;
        }
        .error-alert {
          background: #fff1f0;
          color: #ff4d4f;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .schedule-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .schedule-day-card {
          background: white;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          display: flex;
          flex-direction: column;
        }
        .day-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f0f0f0;
        }
        .day-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .weekday {
          font-size: 16px;
          font-weight: 600;
        }
        .date {
          font-size: 13px;
          color: #999;
        }
        .day-actions {
          display: flex;
          gap: 4px;
        }
        .btn-icon {
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: background 0.2s;
        }
        .btn-icon:hover {
          background: #f5f5f5;
        }
        .time-slots-list {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 12px;
          min-height: 100px;
        }
        .empty-slots {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ccc;
          font-size: 13px;
        }
        .time-slot-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .time-input {
          flex: 1;
          padding: 6px 8px;
          border: 1px solid #d9d9d9;
          border-radius: 6px;
          font-size: 13px;
          width: 70px;
        }
        .time-input:focus {
          outline: none;
          border-color: #667eea;
        }
        .time-separator {
          color: #999;
          font-size: 12px;
        }
        .btn-remove-slot {
          background: none;
          border: none;
          color: #ff4d4f;
          font-size: 18px;
          cursor: pointer;
          padding: 2px 6px;
          border-radius: 4px;
          line-height: 1;
        }
        .btn-remove-slot:hover {
          background: #fff1f0;
        }
        .btn-add-slot {
          width: 100%;
          padding: 8px;
          background: #f5f7fa;
          border: 1px dashed #d9d9d9;
          border-radius: 6px;
          color: #667eea;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-add-slot:hover {
          background: #667eea15;
          border-color: #667eea;
        }
        .actions-bar {
          display: flex;
          justify-content: space-between;
          padding: 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }
        .text-muted {
          color: #999;
        }
        @media (max-width: 1024px) {
          .schedule-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        @media (max-width: 640px) {
          .schedule-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}

export default SkillSchedule;

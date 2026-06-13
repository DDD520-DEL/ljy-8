import { Router } from 'express';
import { skillController } from '../controllers/SkillController';
import { skillScheduleController } from '../controllers/SkillScheduleController';
import { authMiddleware } from '../utils/auth';

const router = Router();

router.get('/', skillController.getSkills.bind(skillController));
router.get('/my', authMiddleware, skillController.getMySkills.bind(skillController));
router.get('/:id', skillController.getSkillById.bind(skillController));
router.post('/', authMiddleware, skillController.createSkill.bind(skillController));
router.put('/:id', authMiddleware, skillController.updateSkill.bind(skillController));

router.get('/:skillId/schedules', skillScheduleController.getSchedules.bind(skillScheduleController));
router.get('/:skillId/available-slots', skillScheduleController.getAvailableSlots.bind(skillScheduleController));
router.post('/:skillId/schedule', authMiddleware, skillScheduleController.setSchedule.bind(skillScheduleController));
router.post('/:skillId/schedules/batch', authMiddleware, skillScheduleController.batchSetSchedule.bind(skillScheduleController));
router.get('/:skillId/check-conflict', skillScheduleController.checkConflict.bind(skillScheduleController));

export default router;

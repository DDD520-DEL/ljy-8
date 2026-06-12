import { Router } from 'express';
import { skillController } from '../controllers/SkillController';
import { authMiddleware } from '../utils/auth';

const router = Router();

router.get('/', skillController.getSkills.bind(skillController));
router.get('/my', authMiddleware, skillController.getMySkills.bind(skillController));
router.get('/:id', skillController.getSkillById.bind(skillController));
router.post('/', authMiddleware, skillController.createSkill.bind(skillController));
router.put('/:id', authMiddleware, skillController.updateSkill.bind(skillController));

export default router;

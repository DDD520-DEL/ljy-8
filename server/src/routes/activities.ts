import { Router } from 'express';
import { activityController } from '../controllers/ActivityController';
import { authMiddleware } from '../utils/auth';

const router = Router();

router.get('/', activityController.getActivities.bind(activityController));
router.get('/my/organized', authMiddleware, activityController.getMyOrganizedActivities.bind(activityController));
router.get('/my/registered', authMiddleware, activityController.getMyRegisteredActivities.bind(activityController));
router.get('/:id', activityController.getActivityById.bind(activityController));
router.post('/', authMiddleware, activityController.createActivity.bind(activityController));
router.put('/:id', authMiddleware, activityController.updateActivity.bind(activityController));
router.post('/:id/register', authMiddleware, activityController.registerActivity.bind(activityController));
router.put('/:id/cancel-registration', authMiddleware, activityController.cancelRegistration.bind(activityController));
router.put('/:id/start', authMiddleware, activityController.startActivity.bind(activityController));
router.put('/:id/complete', authMiddleware, activityController.completeActivity.bind(activityController));
router.put('/:id/cancel', authMiddleware, activityController.cancelActivity.bind(activityController));
router.post('/:id/photos', authMiddleware, activityController.uploadPhoto.bind(activityController));
router.delete('/photos/:photoId', authMiddleware, activityController.deletePhoto.bind(activityController));

export default router;

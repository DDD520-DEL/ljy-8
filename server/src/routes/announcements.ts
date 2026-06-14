import { Router } from 'express';
import { announcementController } from '../controllers/AnnouncementController';
import { authMiddleware, adminMiddleware } from '../utils/auth';

const router = Router();

router.get('/latest', announcementController.getLatestAnnouncements.bind(announcementController));
router.get('/list', announcementController.getAnnouncements.bind(announcementController));
router.get('/:id', announcementController.getAnnouncementById.bind(announcementController));

router.use(authMiddleware);
router.use(adminMiddleware);
router.get('/admin/list', announcementController.getAllAnnouncementsAdmin.bind(announcementController));
router.post('/', announcementController.createAnnouncement.bind(announcementController));
router.put('/:id', announcementController.updateAnnouncement.bind(announcementController));
router.delete('/:id', announcementController.deleteAnnouncement.bind(announcementController));

export default router;

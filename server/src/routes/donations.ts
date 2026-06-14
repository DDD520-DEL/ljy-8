import { Router } from 'express';
import { donationController } from '../controllers/DonationController';
import { authMiddleware } from '../utils/auth';

const router = Router();

router.get('/', donationController.getDonations.bind(donationController));
router.get('/my', authMiddleware, donationController.getMyDonations.bind(donationController));
router.get('/my/applications', authMiddleware, donationController.getMyApplications.bind(donationController));
router.get('/my/received', authMiddleware, donationController.getMyReceivedDonations.bind(donationController));
router.get('/:id', donationController.getDonationById.bind(donationController));
router.post('/', authMiddleware, donationController.createDonation.bind(donationController));
router.post('/:id/apply', authMiddleware, donationController.applyForDonation.bind(donationController));
router.put('/:id/approve', authMiddleware, donationController.approveApplicant.bind(donationController));
router.put('/:id/start-meeting', authMiddleware, donationController.startMeeting.bind(donationController));
router.put('/:id/complete', authMiddleware, donationController.completeDonation.bind(donationController));
router.put('/:id/cancel', authMiddleware, donationController.cancelDonation.bind(donationController));
router.put('/:id/cancel-application', authMiddleware, donationController.cancelApplication.bind(donationController));

export default router;

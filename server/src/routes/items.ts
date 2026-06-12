import { Router } from 'express';
import { itemController } from '../controllers/ItemController';
import { authMiddleware } from '../utils/auth';

const router = Router();

router.get('/', itemController.getItems.bind(itemController));
router.get('/my', authMiddleware, itemController.getMyItems.bind(itemController));
router.get('/:id', itemController.getItemById.bind(itemController));
router.post('/', authMiddleware, itemController.createItem.bind(itemController));
router.put('/:id', authMiddleware, itemController.updateItem.bind(itemController));

export default router;

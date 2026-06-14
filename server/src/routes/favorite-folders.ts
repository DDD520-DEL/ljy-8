import { Router } from 'express';
import { favoriteFolderController } from '../controllers/FavoriteFolderController';
import { authMiddleware } from '../utils/auth';

const router = Router();

router.get('/folders', authMiddleware, favoriteFolderController.getFolders.bind(favoriteFolderController));
router.get('/folders/:folderId', authMiddleware, favoriteFolderController.getFolder.bind(favoriteFolderController));
router.post('/folders', authMiddleware, favoriteFolderController.createFolder.bind(favoriteFolderController));
router.put('/folders/:folderId', authMiddleware, favoriteFolderController.updateFolder.bind(favoriteFolderController));
router.delete('/folders/:folderId', authMiddleware, favoriteFolderController.deleteFolder.bind(favoriteFolderController));

router.get('/folders/:folderId/items', authMiddleware, favoriteFolderController.getFolderItems.bind(favoriteFolderController));
router.post('/folders/:folderId/items', authMiddleware, favoriteFolderController.addToFolder.bind(favoriteFolderController));
router.delete('/folders/:folderId/items/:favoriteId', authMiddleware, favoriteFolderController.removeFromFolder.bind(favoriteFolderController));
router.delete('/folders/:folderId/items', authMiddleware, favoriteFolderController.batchRemoveFromFolder.bind(favoriteFolderController));

router.get('/check', authMiddleware, favoriteFolderController.checkFavoriteStatus.bind(favoriteFolderController));

export default router;

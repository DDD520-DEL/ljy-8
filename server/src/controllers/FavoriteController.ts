import { Response } from 'express';
import { favoriteService } from '../services/FavoriteService';
import { AuthRequest } from '../utils/auth';
export class FavoriteController {
  async getFavorites(req: AuthRequest, res: Response) { try { if (!req.user) { res.status(401).json({ success: false, message: '未登录' }); return; } res.json({ success: true, data: favoriteService.getFavorites(req.user.id) }); } catch (err: any) { res.status(400).json({ success: false, message: err.message }); } }
  async checkFavorite(req: AuthRequest, res: Response) { try { if (!req.user) { res.status(401).json({ success: false, message: '未登录' }); return; } res.json({ success: true, data: { favorited: favoriteService.isFavorited(req.user.id, req.params.itemId) } }); } catch (err: any) { res.status(400).json({ success: false, message: err.message }); } }
  async toggleFavorite(req: AuthRequest, res: Response) { try { if (!req.user) { res.status(401).json({ success: false, message: '未登录' }); return; } res.json({ success: true, data: favoriteService.toggleFavorite(req.user.id, req.params.itemId) }); } catch (err: any) { res.status(400).json({ success: false, message: err.message }); } }
  async addFavorite(req: AuthRequest, res: Response) { try { if (!req.user) { res.status(401).json({ success: false, message: '未登录' }); return; } res.status(201).json({ success: true, data: favoriteService.addFavorite(req.user.id, req.params.itemId) }); } catch (err: any) { res.status(400).json({ success: false, message: err.message }); } }
  async removeFavorite(req: AuthRequest, res: Response) { try { if (!req.user) { res.status(401).json({ success: false, message: '未登录' }); return; } favoriteService.removeFavorite(req.user.id, req.params.itemId); res.json({ success: true }); } catch (err: any) { res.status(400).json({ success: false, message: err.message }); } }
  async getItemFavoriteCount(req: AuthRequest, res: Response) { try { res.json({ success: true, data: { count: favoriteService.getItemFavoriteCount(req.params.itemId) } }); } catch (err: any) { res.status(400).json({ success: false, message: err.message }); } }
}
export const favoriteController = new FavoriteController();

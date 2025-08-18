import { Router } from 'express';
import { adminLogin } from '../controllers/adminAuthController';
import { inviteAdmin, acceptInvite } from '../controllers/authController';
import { getStats, getAdminPosts } from '../controllers/adminStatsController'

import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();


router.post('/invite', requireAuth, requireRole('admin'), inviteAdmin);
router.get('/stats', requireAuth, requireRole('admin'), getStats);
router.post('/accept-invite', acceptInvite);
router.get('/posts', requireAuth, requireRole('admin'), getAdminPosts);

export default router;

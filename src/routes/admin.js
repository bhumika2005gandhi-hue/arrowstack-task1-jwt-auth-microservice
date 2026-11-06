// src/routes/admin.js
import { Router } from 'express';
import { adminController } from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { updateUserRoleSchema } from '../validators/schemas.js';

const router = Router();

// All admin routes require authentication.
router.use(authenticate);

// Moderators+ can read user lists.
router.get('/users', authorize('moderator'), adminController.listUsers);
router.get('/users/:id', authorize('moderator'), adminController.getUser);

// Only admins may mutate roles / status.
router.patch(
  '/users/:id/role',
  authorize('admin'),
  validateBody(updateUserRoleSchema),
  adminController.changeRole
);
router.patch('/users/:id/status', authorize('admin'), adminController.toggleStatus);

export default router;

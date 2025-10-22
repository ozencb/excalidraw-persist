import { Router } from 'express';
import { libraryController } from '../controllers/libraryController';

const router = Router({ mergeParams: true });

router.get('/', libraryController.getByBoardId);
router.put('/', libraryController.save);

export default router;

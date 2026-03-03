import { Router } from 'express';
import { sharedController } from '../controllers/shareController';

const router = Router({ mergeParams: true });

router.get('/:shareId', sharedController.getShareInfo);
router.get('/:shareId/elements', sharedController.getElements);
router.patch('/:shareId/elements', sharedController.applyDelta);
router.put('/:shareId/elements', sharedController.replaceAll);
router.post('/:shareId/files/check', sharedController.checkFiles);
router.post('/:shareId/files', sharedController.uploadFiles);
router.get('/:shareId/library', sharedController.getLibrary);
router.put('/:shareId/library', sharedController.saveLibrary);

export default router;

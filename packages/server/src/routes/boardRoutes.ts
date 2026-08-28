import { Router } from 'express';
import { boardController } from '../controllers/boardController';
import { elementController } from '../controllers/elementController';
import { shareController } from '../controllers/shareController';
import elementRoutes from './elementRoutes';
import libraryRoutes from './libraryRoutes';

const router = Router();

router.get('/', boardController.listActive);
router.get('/trash', boardController.listTrash);
// Deep-linkable named boards: find-or-create the ACTIVE board with this name.
// Registered before '/:id' routes so the literal 'by-name' segment always wins.
router.get('/by-name/:name', boardController.findOrCreateByName);
router.post('/by-name/:name', boardController.findOrCreateByName);
router.post('/', boardController.create);
router.put('/:id', boardController.update);
router.delete('/:id', boardController.moveToTrash);
router.post('/:id/restore', boardController.restoreFromTrash);
router.delete('/:id/permanent', boardController.permanentDelete);
router.use('/:boardId/elements', elementRoutes);
router.use('/:boardId/library', libraryRoutes);
router.post('/:boardId/files/check', elementController.checkFiles);
router.post('/:boardId/files', elementController.uploadFiles);
router.post('/:boardId/share', shareController.createShareLink);
router.get('/:boardId/share', shareController.listShareLinks);

export default router;

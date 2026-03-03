import { Router } from 'express';
import boardRoutes from './boardRoutes';
import shareRoutes from './shareRoutes';

const router = Router();

router.use('/boards', boardRoutes);
router.use('/share', shareRoutes);

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

export default router;

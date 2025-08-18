import { Router } from 'express';
import { getPosts, getPostBySlug, createPost } from '../controllers/postController';

const router = Router();

router.get('/', getPosts);
router.get('/:slug', getPostBySlug);
router.post('/', createPost); // add auth later

export default router;

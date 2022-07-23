import { Router } from "express";
import { listCategories, createCategory } from "../controllers/categoriesController.js";

const router = Router();

router.get('/', listCategories);
router.post('/', createCategory);

export default router;
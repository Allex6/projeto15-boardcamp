import { Router } from "express";
import { createRental, deleteRental, listRentals, returnRental } from "../controllers/rentalsController.js";

const router = Router();

router.get('/', listRentals);
router.post('/', createRental);
router.post('/:id/return', returnRental);
router.delete('/:id', deleteRental);

export default router;
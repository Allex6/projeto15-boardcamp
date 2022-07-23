import { Router } from "express";
import { createCustomer, getCustomer, getCustomers, updateCustomer } from "../controllers/customersController.js";

const router = Router();

router.get('/', getCustomers);
router.get('/:id', getCustomer);
router.post('/', createCustomer);
router.put('/:id', updateCustomer);

export default router;
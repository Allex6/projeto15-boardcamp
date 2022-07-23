import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import categoriesRouter from './lib/routers/categoriesRouter.js';
import gamesRouter from './lib/routers/gamesRouter.js';
import customersRouter from './lib/routers/customersRouter.js';
import rentalsRouter from './lib/routers/rentalsRouter.js';

dotenv.config();

const SERVER_PORT = process.env.PORT || 4000;
const app = express();

app.use(cors());
app.use(express.json());
app.use('/categories', categoriesRouter);
app.use('/games', gamesRouter);
app.use('/customers', customersRouter);
app.use('/rentals', rentalsRouter);

app.listen(SERVER_PORT, () => console.log(`Servidor online na porta ${SERVER_PORT}`));
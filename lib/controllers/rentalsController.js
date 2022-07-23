import dayjs from "dayjs";
import rentalsSchema from "../schemas/rentalsSchema.js";
import formatError from "../utils/formatError.js";
import pg from './../databases/postgres.js';

async function listRentals(req, res, next){

    const { gameId, customerId } = req.query;

    const queryText = `
        SELECT rentals.*, categories.name AS "categoryName", customers.name AS "customerName", games.name AS "gameName", games."categoryId"
        FROM rentals
        JOIN customers
        ON customers.id = rentals."customerId"
        JOIN games
        ON games.id = rentals."gameId"
        JOIN categories
        ON games."categoryId" = categories.id
        ${(gameId) ? 'WHERE rentals."gameId" = $1' : ''}
        ${(gameId && customerId) ? 'AND rentals."customerId" = $2' : ''}
        ${(!gameId && customerId) ? 'WHERE rentals."customerId" = $1' : ''}
    `;

    const queryParams = [];
    if(gameId) queryParams.push(gameId);
    if(customerId) queryParams.push(customerId);

    const { rows: rentals } = await pg.query(queryText, queryParams);

    const formattedResults = rentals.map(row=>{

        row.customer = {
            id: row.customerId,
            name: row.customerName
        };

        row.game = {
            id: row.gameId,
            name: row.gameName,
            categoryId: row.categoryId,
            categoryName: row.categoryName
        };
        
        delete row.customerName;
        delete row.categoryName;
        delete row.gameName;
        return row;

    });

    res.send(formattedResults);

}

async function createRental(req, res, next){

    const bodyData = {...req.body};

    const { error } = rentalsSchema.validate(bodyData);
    if(error) return res.status(400).send(formatError(error));

    const { rows: customers } = await pg.query(`
        SELECT * FROM customers
        WHERE id = $1
        LIMIT 1
    `, [
        bodyData.customerId
    ]);

    if(customers.length === 0) return res.sendStatus(400);

    const { rows: games } = await pg.query(`
        SELECT * FROM games
        WHERE id = $1
        LIMIT 1
    `, [
        bodyData.gameId
    ]);

    if(games.length === 0) return res.sendStatus(400);

    const game = games[0];

    bodyData.rentDate = new Date();
    bodyData.originalPrice = bodyData.daysRented * game.pricePerDay;
    bodyData.returnDate = null;
    bodyData.delayFee = null;

    const { rows: rentals } = await pg.query(`
        SELECT * FROM rentals
        WHERE "gameId" = $1 AND "returnDate" IS NULL
    `, [
        bodyData.gameId
    ]);

    if(rentals.length >= game.stockTotal) return res.sendStatus(400);

    await pg.query(`
        INSERT INTO rentals ("customerId", "gameId", "daysRented", "rentDate", "originalPrice", "returnDate", "delayFee") VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
        bodyData.customerId,
        bodyData.gameId,
        bodyData.daysRented,
        bodyData.rentDate,
        bodyData.originalPrice,
        bodyData.returnDate,
        bodyData.delayFee
    ]);

    res.sendStatus(201);

}

async function returnRental(req, res, next){

    const { id } = req.params;

    const { rows: rentals } = await pg.query(`
        SELECT * FROM rentals
        WHERE id = $1
        LIMIT 1
    `, [
        id
    ]);

    if(rentals.length === 0) return res.sendStatus(404);

    const rental = rentals[0];
    if(rental.returnDate !== null) return res.sendStatus(400);

    const { rows: games } = await pg.query(`
        SELECT * FROM games
        WHERE id = $1
        LIMIT 1
    `, [
        rental.gameId
    ]);

    if(games.length === 0) return res.sendStatus(500);

    const pricePerDay = games[0].pricePerDay;
    const returnDate = dayjs();
    const rentDate = dayjs(rental.rentDate);
    const daysRented = rental.daysRented;
    const daysPassed = returnDate.diff(rentDate, 'days');
    const lateDays = daysPassed - daysRented;
    const delayFee = (lateDays > 0) ? pricePerDay * lateDays : 0;

    await pg.query(`
        UPDATE rentals
        SET "returnDate" = $1, "delayFee" = $2
        WHERE id = $3
    `, [
        returnDate.toDate().toISOString(),
        delayFee,
        id
    ]);

    res.sendStatus(200);

}

async function deleteRental(req, res, next){

    const { id } = req.params;

    const { rows: rentals } = await pg.query(`
        SELECT * FROM rentals
        WHERE id = $1
        LIMIT 1
    `, [
        id
    ]);

    if(rentals.length === 0) return res.sendStatus(404);

    const rental = rentals[0];
    if(rental.returnDate === null) return res.sendStatus(400);

    await pg.query(`
        DELETE FROM rentals
        WHERE id = $1
    `, [
        id
    ]);

    res.sendStatus(200);

}

export {
    listRentals,
    createRental,
    returnRental,
    deleteRental
};
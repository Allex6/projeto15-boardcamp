import formatError from "../utils/formatError.js";
import pg from './../databases/postgres.js';
import gamesSchema from './../schemas/gamesSchema.js';

async function listGames(req, res, next){

    const { name } = req.query;

    let queryText = `
        SELECT games.*, categories.name as "categoryName" FROM games
        JOIN categories
        ON categories.id = games."categoryId"
        ${(typeof name === 'string') ? "WHERE LOWER(games.name) LIKE LOWER($1)" : ""}
    `;

    const queryParams = [];
    if(name) queryParams.push(`${name}%`);

    const { rows: games } = await pg.query(queryText, queryParams);

    res.send(games);

}

async function createGame(req, res, next){

    const bodyData = req.body;

    const { error } = gamesSchema.validate(bodyData);
    if(error) return res.status(400).send(formatError(error));

    const { rows: games } = await pg.query(`
        SELECT * FROM games
        WHERE name = $1
        LIMIT 1
    `, [
        bodyData.name
    ]);

    if(games.length > 0) return res.sendStatus(409);

    const { rows: categories } = await pg.query(`
        SELECT * FROM categories
        WHERE id = $1
        LIMIT 1
    `, [
        bodyData.categoryId
    ]);

    if(categories.length === 0) return res.sendStatus(400);

    await pg.query(`
        INSERT INTO games ("name", "stockTotal", "pricePerDay", "categoryId", "image") VALUES ($1, $2, $3, $4, $5)
    `, [
        bodyData.name,
        bodyData.stockTotal,
        bodyData.pricePerDay,
        bodyData.categoryId,
        bodyData.image
    ]);

    res.sendStatus(201);

}

export {
    listGames,
    createGame
};
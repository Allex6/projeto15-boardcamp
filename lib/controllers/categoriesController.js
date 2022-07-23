import pg from './../databases/postgres.js';
import categoriesSchema from './../schemas/categoriesSchema.js';
import formatError from "../utils/formatError.js";


async function listCategories(req, res, next){

    const { rows: categories } = await pg.query(`
        SELECT * FROM categories
    `);
    
    res.send(categories);
    
}

async function createCategory(req, res, next){

    const bodyData = req.body;

    const { error } = categoriesSchema.validate(bodyData);
    if(error) return res.status(400).send(formatError(error));

    const { rows: categories } = await pg.query(`
        SELECT * from categories
        WHERE name = $1
    `, [
        bodyData.name
    ]);

    if(categories.length > 0) return res.sendStatus(409);

    await pg.query(`
        INSERT INTO categories (name) VALUES ($1)
    `, [
        bodyData.name
    ]);

    res.sendStatus(201);

}

export {
    listCategories,
    createCategory
};
import pg from './../databases/postgres.js';
import customersSchema from "../schemas/customersSchema.js";
import formatError from "../utils/formatError.js";

async function getCustomers(req, res, next){

    const { cpf } = req.query;

    const queryText = `
        SELECT * FROM customers
        ${(typeof cpf === 'string') ? "WHERE LOWER(cpf) LIKE LOWER($1)" : ""}
    `;

    const queryParams = [];
    if(cpf) queryParams.push(`${cpf}%`);

    const { rows: customers } = await pg.query(queryText, queryParams);
    res.send(customers);

}

async function getCustomer(req, res, next){

    const { id } = req.params;

    const { rows: customers } = await pg.query(`
        SELECT * FROM customers
        WHERE id = $1
        LIMIT 1
    `, [
        id
    ]);

    if(customers.length > 0) return res.send(customers[0]);
    res.sendStatus(404);

}

async function createCustomer(req, res, next){

    const bodyData = req.body;
    
    const { error } = customersSchema.validate(bodyData);
    if(error) return res.status(400).send(formatError(error));

    const { rows: customers } = await pg.query(`
        SELECT * FROM customers
        WHERE cpf = $1
        LIMIT 1
    `, [
        bodyData.cpf
    ]);

    if(customers.length > 0) return res.sendStatus(409);

    await pg.query(`
        INSERT INTO customers ("name", "phone", "cpf", "birthday") VALUES ($1, $2, $3, $4)
    `, [
        bodyData.name,
        bodyData.phone,
        bodyData.cpf,
        bodyData.birthday
    ]);

    res.sendStatus(201);

}

async function updateCustomer(req, res, next){

    const bodyData = req.body;
    const { id } = req.params;
    
    const { error } = customersSchema.validate(bodyData);
    if(error) return res.status(400).send(formatError(error));

    await pg.query(`
        UPDATE customers SET "name" = $1, "phone" = $2, "cpf" = $3, "birthday" = $4
        WHERE id = $5
    `, [
        bodyData.name,
        bodyData.phone,
        bodyData.cpf,
        bodyData.birthday,
        id
    ]);

    res.sendStatus(200);

}

export {
    getCustomers,
    getCustomer,
    createCustomer,
    updateCustomer
};
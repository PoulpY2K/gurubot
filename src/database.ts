import {Pool} from "mariadb";
import mariadb from 'mariadb';

export const pool: Pool = mariadb.createPool({
    connectionLimit: 100,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    port: 3306,
});
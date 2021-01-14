import { config } from "dotenv";

config();

import { Client } from "pg";

export default class Database
{
    public client: Client;

    public constructor()
    {
        const user = process.env.DB_USER;
        const host = process.env.DB_HOST;
        const database = process.env.DB_NAME;
        const password = process.env.DB_PASSWORD;
        const port = process.env.DB_PORT;

        if (!user)
        {
            throw new Error("DB_USER is required in .env");
        }
        else if (!host)
        {
            throw new Error("DB_HOST is required in .env");
        }
        else if (!database)
        {
            throw new Error("DB_NAME is required in .env");
        }
        else if (!password)
        {
            throw new Error("DB_PASSWORD is required in .env");
        }
        else if (!port)
        {
            throw new Error("DB_PORT is required in .env");
        }

        this.client = new Client({
            user,
            host,
            database,
            password,
            port: parseInt(port),
        });
    }
}
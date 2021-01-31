import { Client } from "pg";

export default class Database
{
    public static client: Client;

    public static init(): void
    {
        Database.client = new Client({ connectionString: process.env.DATABASE_URL });
    }
}
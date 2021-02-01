import { Client } from "pg";

export default class Database
{
    public static client: Client;

    public static async init(): Promise<void>
    {
        Database.client = new Client({ connectionString: process.env.DATABASE_URL });

        await this.client.connect();
    }
}
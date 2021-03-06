import { Client, types } from "pg";

export default class Database
{
    public static client: Client;

    public static async init(): Promise<void>
    {
        Database.client = new Client({ connectionString: process.env.DATABASE_URL });

        // 1082 -> DATE
        types.setTypeParser(1082, string => new Date(`${string}T00:00:00Z`));

        // 1114 -> TIMESTAMP
        types.setTypeParser(1114, string => new Date(`${string.replace(" ", "T")}Z`));

        await this.client.connect();
    }
}
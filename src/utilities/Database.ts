import { PrismaClient } from "@prisma/client";

export default class Database
{
    public static client: PrismaClient;

    public static init(): void
    {
        Database.client = new PrismaClient();
    }
}
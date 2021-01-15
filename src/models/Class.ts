import { PrismaClient } from "@prisma/client";
import ISerializable from "../common/ISerializable";

interface IClass
{
    name: string;
}

export interface ISerializedClass
{
    name: string;
}

export default class Class implements ISerializable
{
    private constructor(public data: IClass)
    {}

    public async serialize(): Promise<ISerializedClass>
    {
        return {
            name: this.data.name,
        };
    }

    public static async create(data: IClass): Promise<Class>
    {
        const db = new PrismaClient();

        await db.class.create({
            data: {
                name: data.name,
            },
        });

        return new Class(data);
    }

    public static async retrieve(id: string): Promise<Class>
    {
        const db = new PrismaClient();

        const retrievedClass = await db.class.findUnique({
            where: {
                name: id,
            },
        });

        if (!retrievedClass)
        {
            throw new Error("This class does not exist");
        }

        return new Class(retrievedClass);
    }
}
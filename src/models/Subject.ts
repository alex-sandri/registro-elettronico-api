import { PrismaClient } from "@prisma/client";
import ISerializable from "../common/ISerializable";

interface ISubject
{
    name: string;
    description: string;
}

export interface ISerializedSubject
{
    name: string;
    description: string;
}

export default class Subject implements ISerializable
{
    private constructor(public data: ISubject)
    {}

    public async serialize(): Promise<ISerializedSubject>
    {
        return {
            name: this.data.name,
            description: this.data.description,
        };
    }

    public static async create(data: ISubject): Promise<Subject>
    {
        const db = new PrismaClient();

        await db.subject.create({
            data: {
                name: data.name,
                description: data.description,
            },
        });

        return new Subject(data);
    }

    public static async retrieve(id: string): Promise<Subject | null>
    {
        const db = new PrismaClient();

        const subject = await db.subject.findUnique({
            where: {
                name: id,
            },
        });

        if (!subject)
        {
            return null;
        }

        return new Subject(subject);
    }
}
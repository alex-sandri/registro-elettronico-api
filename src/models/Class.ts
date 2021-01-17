import { PrismaClient } from "@prisma/client";
import ISerializable from "../common/ISerializable";
import Student, { ISerializedStudent } from "./Student";

interface IClass
{
    name: string;
}

export interface ISerializedClass
{
    name: string;
    students: ISerializedStudent[];
}

export default class Class implements ISerializable
{
    private constructor(public data: IClass)
    {}

    public async serialize(): Promise<ISerializedClass>
    {
        const students = await Student.for(this);

        return {
            name: this.data.name,
            students: await Promise.all(students.map(_ => _.serialize())),
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

    public static async retrieve(id: string): Promise<Class | null>
    {
        const db = new PrismaClient();

        const retrievedClass = await db.class.findUnique({
            where: {
                name: id,
            },
        });

        if (!retrievedClass)
        {
            return null;
        }

        return new Class(retrievedClass);
    }
}
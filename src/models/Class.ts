import { ISerializable } from "../common/ISerializable";
import Database from "../utilities/Database";
import Teacher from "./Teacher";

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
        const db = Database.client;

        await db.class.create({
            data: {
                name: data.name,
            },
        });

        return new Class(data);
    }

    public static async retrieve(id: string): Promise<Class | null>
    {
        const db = Database.client;

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

    public static async list(): Promise<Class[]>
    {
        const db = Database.client;

        const classes = await db.class.findMany();

        return classes.map(_ => new Class(_));
    }

    public static async for(teacher: Teacher): Promise<Class[]>
    {
        const db = Database.client;

        const classes = await db.teaching.findMany({
            where: {
                teacher: teacher.data.email,
            },
            include: {
                Class: true,
            },
        });

        return classes.map(_ => new Class(_.Class));
    }
}
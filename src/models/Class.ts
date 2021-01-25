import { ISerializable } from "@alex-sandri/api";
import { CLASS_CREATE_SCHEMA } from "../config/Schemas";
import Database from "../utilities/Database";
import Student, { ISerializedStudent } from "./Student";
import Teacher from "./Teacher";

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

    public async serialize(includeStudents = true): Promise<ISerializedClass>
    {
        let students: Student[] = [];

        if (includeStudents)
        {
            students = await Student.for(this);
        }

        return {
            name: this.data.name,
            students: await Promise.all(students.map(_ => _.serialize())),
        };
    }

    public static async create(data: IClass): Promise<Class>
    {
        const result = CLASS_CREATE_SCHEMA.validate(data);

        if (result.error)
        {
            throw new Error(result.error.message);
        }

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
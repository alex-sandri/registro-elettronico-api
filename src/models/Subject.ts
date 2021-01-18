import ISerializable from "../common/ISerializable";
import { SUBJECT_CREATE_SCHEMA } from "../common/Schemas";
import Database from "../utilities/Database";

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
        const result = SUBJECT_CREATE_SCHEMA.validate(data);

        if (result.error)
        {
            throw new Error(result.error.message);
        }

        const db = Database.client;

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
        const db = Database.client;

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
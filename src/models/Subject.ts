import { PrismaClient } from "@prisma/client";
import ApiOperationResult from "../common/ApiOperationResult";
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

    public static async create(data: ISubject): Promise<ApiOperationResult<Subject>>
    {
        const db = new PrismaClient();

        const result = new ApiOperationResult<Subject>();

        await db.subject.create({
            data: {
                name: data.name,
                description: data.description,
            },
        });

        result.data = new Subject(data);

        return result;
    }

    public static async retrieve(id: string): Promise<ApiOperationResult<Subject>>
    {
        const db = new PrismaClient();

        const result = new ApiOperationResult<Subject>();

        const subject = await db.subject.findUnique({
            where: {
                name: id,
            },
        });

        if (!subject)
        {
            throw new Error("This subject does not exist");
        }

        result.data = new Subject(subject);

        return result;
    }
}
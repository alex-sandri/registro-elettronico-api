import { PrismaClient } from "@prisma/client";
import ApiOperationResult from "../common/ApiOperationResult";
import ISerializable from "../common/ISerializable";
import Class, { ISerializedClass } from "./Class";
import Subject, { ISerializedSubject } from "./Subject";
import Teacher from "./Teacher";

interface ITeaching
{
    teacher: string;
    class: string;
    subject: string;
}

export interface ISerializedTeaching
{
    class: ISerializedClass;
    subject: ISerializedSubject;
}

export default class Teaching implements ISerializable
{
    private constructor(public data: ITeaching)
    {}

    public async serialize(): Promise<ISerializedTeaching>
    {
        const { data: teachingClass } = await Class.retrieve(this.data.class);
        const { data: subject } = await Subject.retrieve(this.data.subject);

        return {
            class: await teachingClass!.serialize(),
            subject: await subject!.serialize(),
        };
    }

    public static async create(data: ITeaching): Promise<ApiOperationResult<Teaching>>
    {
        const db = new PrismaClient();

        const result = new ApiOperationResult<Teaching>();

        await db.teaching.create({
            data: {
                Class: {
                    connect: {
                        name: data.class,
                    },
                },
                Subject: {
                    connect: {
                        name: data.subject,
                    },
                },
                Teacher: {
                    connect: {
                        email: data.teacher,
                    },
                },
            },
        });

        result.data = new Teaching(data);

        return result;
    }

    public static async for(teacher: Teacher): Promise<Teaching[]>
    {
        const db = new PrismaClient();

        const classes = await db.teaching.findMany({
            where: {
                teacher: teacher.data.email,
            },
        });

        return classes.map(_ => new Teaching(_));
    }
}
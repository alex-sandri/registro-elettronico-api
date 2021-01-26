import { ISerializable } from "@alex-sandri/api";
import Database from "../utilities/Database";
import Class, { ISerializedClass } from "./Class";
import Subject, { ISerializedSubject } from "./Subject";
import Teacher, { ISerializedTeacher } from "./Teacher";

interface ITeaching
{
    teacher: string;
    class: string;
    subject: string;
}

export interface ISerializedTeaching
{
    teacher: ISerializedTeacher;
    class: ISerializedClass;
    subject: ISerializedSubject;
}

export default class Teaching implements ISerializable
{
    private constructor(public data: ITeaching)
    {}

    public async serialize(): Promise<ISerializedTeaching>
    {
        const teacher = await Teacher.retrieve(this.data.teacher);
        const teachingClass = await Class.retrieve(this.data.class);
        const subject = await Subject.retrieve(this.data.subject);

        return {
            teacher: await teacher!.serialize(),
            class: await teachingClass!.serialize(),
            subject: await subject!.serialize(),
        };
    }

    public static async create(data: ITeaching): Promise<Teaching>
    {
        const db = Database.client;

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

        return new Teaching(data);
    }

    public static async for(teacher: Teacher): Promise<Teaching[]>
    {
        const db = Database.client;

        const teachings = await db.teaching.findMany({
            where: {
                teacher: teacher.data.email,
            },
        });

        return teachings.map(_ => new Teaching(_));
    }
}
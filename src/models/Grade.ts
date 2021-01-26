import { v4 as uuidv4 } from "uuid";

import { ISerializable } from "@alex-sandri/api";
import Database from "../utilities/Database";
import Student from "./Student";
import Subject, { ISerializedSubject } from "./Subject";

interface IGrade
{
    student: string;
    subject: string;
    value: number;
    timestamp: Date;
    description: string;
}

export interface ISerializedGrade
{
    value: number;
    timestamp: string;
    description: string;
    subject: ISerializedSubject;
}

export default class Grade implements ISerializable
{
    private constructor(public data: IGrade)
    {}

    public async serialize(): Promise<ISerializedGrade>
    {
        const subject = await Subject.retrieve(this.data.subject);

        return {
            value: this.data.value,
            timestamp: this.data.timestamp.toISOString(),
            description: this.data.description,
            subject: await subject!.serialize(),
        };
    }

    public static async create(data: IGrade): Promise<Grade>
    {
        const db = Database.client;

        await db.grade.create({
            data: {
                id: uuidv4(),
                value: data.value,
                timestamp: data.timestamp,
                description: data.description,
                Student: {
                    connect: {
                        email: data.student,
                    },
                },
                Subject: {
                    connect: {
                        name: data.subject,
                    },
                },
            },
        });

        return new Grade(data);
    }

    public static async for(student: Student): Promise<Grade[]>
    {
        const db = Database.client;

        const grades = await db.grade.findMany({
            where: {
                student: student.data.email,
            },
        });

        return grades.map(_ => new Grade(_));
    }
}
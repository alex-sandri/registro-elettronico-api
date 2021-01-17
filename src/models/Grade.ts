import ISerializable from "../common/ISerializable";
import Database from "../utilities/Database";
import Student from "./Student";

interface IGrade
{
    student: string;
    value: number;
    timestamp: Date;
    description: string;
}

export interface ISerializedGrade
{
    value: number;
    timestamp: Date;
    description: string;
}

export default class Grade implements ISerializable
{
    private constructor(public data: IGrade)
    {}

    public async serialize(): Promise<ISerializedGrade>
    {
        return {
            value: this.data.value,
            timestamp: this.data.timestamp,
            description: this.data.description,
        };
    }

    public static async create(data: IGrade): Promise<Grade>
    {
        const db = Database.client;

        await db.grade.create({
            data: {
                value: data.value,
                timestamp: data.timestamp,
                description: data.description,
                Student: {
                    connect: {
                        email: data.student,
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
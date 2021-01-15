import { PrismaClient } from "@prisma/client";
import ApiOperationResult from "../common/ApiOperationResult";
import ISerializable from "../common/ISerializable";
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

    public static async create(data: IGrade): Promise<ApiOperationResult<Grade>>
    {
        const db = new PrismaClient();

        const result = new ApiOperationResult<Grade>();

        const student = await Student.retrieve(data.student);

        if (!student.data)
        {
            result.errors = student.errors;

            return result;
        }

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

        result.data = new Grade(data);

        return result;
    }

    public static async for(student: Student): Promise<Grade[]>
    {
        const db = new PrismaClient();

        const grades = await db.grade.findMany({
            where: {
                student: student.data.email,
            },
        });

        return grades.map(_ => new Grade(_));
    }
}
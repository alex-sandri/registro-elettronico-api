import { ISerializable } from "../common/ISerializable";
import Database from "../utilities/Database";
import Utilities from "../utilities/Utilities";
import Student from "./Student";
import Subject, { ISerializedSubject } from "./Subject";
import Teacher, { ISerializedTeacher } from "./Teacher";

interface IGrade
{
    value: number;
    timestamp: Date;
    description: string;
    student: string;
    subject: string;
    teacher: string;
}

export interface ISerializedGrade
{
    value: number;
    timestamp: string;
    description: string;
    subject: ISerializedSubject;
    teacher: ISerializedTeacher;
}

export default class Grade implements ISerializable
{
    private constructor(public data: IGrade)
    {}

    public async serialize(): Promise<ISerializedGrade>
    {
        const subject = await Subject.retrieve(this.data.subject);
        const teacher = await Teacher.retrieve(this.data.teacher);

        return {
            value: this.data.value,
            timestamp: this.data.timestamp.toISOString(),
            description: this.data.description,
            subject: await subject!.serialize(),
            teacher: await teacher!.serialize(),
        };
    }

    public static async create(data: IGrade): Promise<Grade>
    {
        const db = Database.client;

        await db.query(
            "insert into grades (id, value, timestamp, description, student, subject, teacher) values ($1, $2, $3, $4, $5, $6, $7)",
            [ Utilities.id(), data.value, data.timestamp, data.description, data.student, data.subject, data.teacher ],
        );

        return new Grade(data);
    }

    public static async for(student: Student): Promise<Grade[]>
    {
        const db = Database.client;

        const result = await db.query(
            "select * from grades where student = $1",
            [ student.data.email ],
        );

        return result.rows.map(_ => new Grade(_));
    }
}
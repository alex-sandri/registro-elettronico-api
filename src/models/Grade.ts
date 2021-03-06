import { ISerializable } from "../common/ISerializable";
import Database from "../utilities/Database";
import Student from "./Student";
import Subject, { ISerializedSubject } from "./Subject";
import Teacher, { ISerializedTeacher } from "./Teacher";

interface IGrade
{
    id: string;
    value: number;
    timestamp: Date;
    description: string;
    student: string;
    subject: string;
    teacher: string;
}

interface ICreateGrade
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
    id: string;
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
            id: this.data.id,
            // pg returns numbers in a string format
            value: parseInt(`${this.data.value}`, 10),
            timestamp: this.data.timestamp.toISOString(),
            description: this.data.description,
            subject: await subject!.serialize(),
            teacher: await teacher!.serialize(),
        };
    }

    public static async create(data: ICreateGrade): Promise<Grade>
    {
        const db = Database.client;

        const student = await Student.retrieve(data.student);

        if (!student)
        {
            throw new Error("This student does not exist");
        }

        const subject = await Subject.retrieve(data.subject);

        if (!subject)
        {
            throw new Error("This subject does not exist");
        }

        const teacher = await Teacher.retrieve(data.teacher);

        if (!teacher)
        {
            throw new Error("This teacher does not exist");
        }
        else
        {
            const result = await db.query(
                "select * from teachings where class = $1 and teacher = $2 and subject = $3",
                [ student.data.class, teacher.data.email, subject.data.name ],
            );

            if (result.rowCount === 0)
            {
                throw new Error(`'${subject.data.name}' is not taught by '${teacher.data.email}' in '${student.data.class}'`)
            }
        }

        const result = await db.query(
            "insert into grades (value, timestamp, description, student, subject, teacher) values ($1, $2, $3, $4, $5, $6) returning id",
            [ data.value, data.timestamp.toISOString(), data.description, data.student, data.subject, data.teacher ],
        );

        return new Grade({ ...data, id: result.rows[0].id });
    }

    public static async retrieve(id: string): Promise<Grade | null>
    {
        const db = Database.client;

        const result = await db.query(
            "select * from grades where id = $1",
            [ id ],
        );

        if (result.rowCount === 0)
        {
            return null;
        }

        return new Grade(result.rows[0]);
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

    public async delete(): Promise<void>
    {
        const db = Database.client;

        await db.query(
            "delete from grades where id = $1",
            [ this.data.id ],
        );
    }
}
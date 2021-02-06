import { ISerializable } from "../common/ISerializable";
import Database from "../utilities/Database";
import Class, { ISerializedClass } from "./Class";
import Subject, { ISerializedSubject } from "./Subject";
import Teacher, { ISerializedTeacher } from "./Teacher";
import User from "./User";

interface ICreateLesson
{
    subject: string;
    class: string;
    description: string;
    hour: number;
    duration: number;
}

interface IUpdateLesson
{
    description?: string;
    hour?: number;
    duration?: number;
}

interface ILesson extends ICreateLesson
{
    id: string;
    teacher: string;
}

export interface ISerializedLesson
{
    id: string;
    teacher: ISerializedTeacher;
    subject: ISerializedSubject;
    class: ISerializedClass;
    description: string;
    hour: number;
    duration: number;
}

export class Lesson implements ISerializable
{
    private constructor(public data: ILesson)
    {}

    public async serialize(): Promise<ISerializedLesson>
    {
        const teacher = await Teacher.retrieve(this.data.teacher) as Teacher;
        const subject = await Subject.retrieve(this.data.subject) as Subject;
        const lessonClass = await Subject.retrieve(this.data.class) as Class;

        return {
            id: this.data.id,
            teacher: await teacher.serialize(),
            subject: await subject.serialize(),
            class: await lessonClass.serialize(),
            description: this.data.description,
            hour: this.data.hour,
            duration: this.data.duration,
        };
    }

    public static async create(data: ICreateLesson, teacher: User): Promise<Lesson>
    {
        const db = Database.client;

        if (!await Class.retrieve(data.class))
        {
            throw new Error(`The class '${data.class}' does not exist`);
        }

        if (!await Subject.retrieve(data.subject))
        {
            throw new Error(`The subject '${data.subject}' does not exist`);
        }
        else
        {
            const result = await db.query(
                "select * from teachings where class = $1 and teacher = $2 and subject = $3",
                [ data.class, teacher.data.email, data.subject ],
            );

            if (result.rowCount === 0)
            {
                throw new Error(`'${data.subject}' is not taught by '${teacher.data.email}' in '${data.class}'`)
            }
        }

        const result = await db.query(
            `insert into lessons ("subject", "class", "description", "hour", "duration", "teacher") values ($1, $2, $3, $4, $5, $6) returning *`,
            [ data.subject, data.class, data.description, data.hour, data.duration, teacher.data.email ],
        );

        return new Lesson(result.rows[0]);
    }

    public async update(data: IUpdateLesson): Promise<Lesson>
    {
        this.data.description = data.description ?? this.data.description;
        this.data.hour = data.hour ?? this.data.hour;
        this.data.duration = data.duration ?? this.data.duration;

        await Database.client.query(
            `update lessons set "description" = $1, "hour" = $2, "duration" = $3, where "id" = $6`,
            [ this.data.description, this.data.hour, this.data.duration, this.data.id ],
        );

        return this;
    }

    public static async retrieve(id: string): Promise<Lesson | null>
    {
        const result = await Database.client.query(
            "select * from lessons where id = $1",
            [ id ],
        );

        if (result.rowCount === 0)
        {
            return null;
        }

        return new Lesson(result.rows[0]);
    }

    public async delete(): Promise<void>
    {
        await Database.client.query(
            "delete from lessons where id = $1",
            [ this.data.id ],
        );
    }
}
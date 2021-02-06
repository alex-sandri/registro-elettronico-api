import { ISerializable } from "../common/ISerializable";
import Database from "../utilities/Database";
import Subject, { ISerializedSubject } from "./Subject";
import Teacher, { ISerializedTeacher } from "./Teacher";

interface ICreateLesson
{
    subject: string;
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

        return {
            id: this.data.id,
            teacher: await teacher.serialize(),
            subject: await subject.serialize(),
            description: this.data.description,
            hour: this.data.hour,
            duration: this.data.duration,
        };
    }

    public static async create(data: ICreateLesson, teacher: Teacher): Promise<Lesson>
    {
        const result = await Database.client.query(
            `insert into lessons ("subject", "description", "hour", "duration", "teacher") values ($1, $2, $3, $4, $5) returning *`,
            [ data.subject, data.description, data.hour, data.duration, teacher.data.email ],
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
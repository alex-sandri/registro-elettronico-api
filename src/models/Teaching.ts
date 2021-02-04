import { ISerializable } from "../common/ISerializable";
import Database from "../utilities/Database";
import Class, { ISerializedClass } from "./Class";
import Subject, { ISerializedSubject } from "./Subject";
import Teacher, { ISerializedTeacher } from "./Teacher";

interface ITeaching
{
    id: string;
    teacher: string;
    class: string;
    subject: string;
}

interface ICreateTeaching
{
    teacher: string;
    class: string;
    subject: string;
}

export interface ISerializedTeaching
{
    id: string;
    teacher: ISerializedTeacher;
    class: ISerializedClass;
    subject: ISerializedSubject;
}

export default class Teaching implements ISerializable
{
    private constructor(public readonly data: ITeaching)
    {}

    public async serialize(): Promise<ISerializedTeaching>
    {
        const teacher = await Teacher.retrieve(this.data.teacher);
        const teachingClass = await Class.retrieve(this.data.class);
        const subject = await Subject.retrieve(this.data.subject);

        return {
            id: this.data.id,
            teacher: await teacher!.serialize(),
            class: await teachingClass!.serialize(),
            subject: await subject!.serialize(),
        };
    }

    public static async create(data: ICreateTeaching): Promise<Teaching>
    {
        const db = Database.client;

        const teachingClass = await Class.retrieve(data.class);

        if (!teachingClass)
        {
            throw new Error("This class does not exist");
        }

        const teacher = await Teacher.retrieve(data.teacher);

        if (!teacher)
        {
            throw new Error("This teacher does not exist");
        }

        const subject = await Subject.retrieve(data.subject);

        if (!subject)
        {
            throw new Error("This subject does not exist");
        }
        else
        {
            const result = await db.query(
                "select * from teachings where class = $1 and teacher = $2 and subject = $3",
                [ teachingClass.data.name, teacher.data.email, subject.data.name ],
            );

            if (result.rowCount > 0)
            {
                throw new Error(`'${teacher.data.email}' already teaches '${subject.data.name}' in '${teachingClass.data.name}'`)
            }
        }

        const result = await db.query(
            "insert into teachings (class, subject, teacher) values ($1, $2, $3) returning *",
            [ data.class, data.subject, data.teacher ],
        );

        return new Teaching(result.rows[0]);
    }

    public static async retrieve(id: string): Promise<Teaching | null>
    {
        const db = Database.client;

        const result = await db.query(
            "select * from teachings where id = $1",
            [ id ]
        );

        if (result.rowCount === 0)
        {
            return null;
        }

        return new Teaching(result.rows[0]);
    }

    public static async list(): Promise<Teaching[]>
    {
        const db = Database.client;

        const result = await db.query("select * from teachings");

        return result.rows.map(_ => new Teaching(_));
    }

    public async delete(): Promise<void>
    {
        await Database.client.query(
            "delete from teachings where id = $1",
            [ this.data.id ],
        );
    }

    public static async for(teacher: Teacher): Promise<Teaching[]>
    {
        const db = Database.client;

        const result = await db.query(
            "select * from teachings where teacher = $1",
            [ teacher.data.email ],
        );

        return result.rows.map(_ => new Teaching(_));
    }
}
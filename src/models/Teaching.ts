import { ISerializable } from "../common/ISerializable";
import Database from "../utilities/Database";
import Utilities from "../utilities/Utilities";
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
    id: string;
    teacher: ISerializedTeacher;
    class: ISerializedClass;
    subject: ISerializedSubject;
}

export default class Teaching implements ISerializable
{
    private constructor(public id: string, public data: ITeaching)
    {}

    public async serialize(): Promise<ISerializedTeaching>
    {
        const teacher = await Teacher.retrieve(this.data.teacher);
        const teachingClass = await Class.retrieve(this.data.class);
        const subject = await Subject.retrieve(this.data.subject);

        return {
            id: this.id,
            teacher: await teacher!.serialize(),
            class: await teachingClass!.serialize(),
            subject: await subject!.serialize(),
        };
    }

    public static async create(data: ITeaching): Promise<Teaching>
    {
        const db = Database.client;

        if (await Class.retrieve(data.class) === null)
        {
            throw new Error("This class does not exist");
        }

        if (await Subject.retrieve(data.subject) === null)
        {
            throw new Error("This subject does not exist");
        }

        if (await Teacher.retrieve(data.teacher) === null)
        {
            throw new Error("This teacher does not exist");
        }

        const id = Utilities.id();

        await db.query(
            "insert into teachings (id, class, subject, teacher) values ($1, $2, $3, $4)",
            [ id, data.class, data.subject, data.teacher ],
        );

        return new Teaching(id, data);
    }

    public static async for(teacher: Teacher): Promise<Teaching[]>
    {
        const db = Database.client;

        const result = await db.query(
            "select * from teachings where teacher = $1",
            [ teacher.data.email ],
        );

        return result.rows.map(_ => new Teaching(_.id, _));
    }
}
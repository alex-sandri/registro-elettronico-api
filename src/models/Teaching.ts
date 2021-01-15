import ApiOperationResult from "../common/ApiOperationResult";
import ISerializable from "../common/ISerializable";
import Database from "../utilities/Database";
import Class, { ISerializedClass } from "./Class";
import Subject, { ISerializedSubject } from "./Subject";
import Teacher from "./Teacher";

interface ITeaching
{
    teacher: string;
    class: string;
    subject: string;
}

export interface ISerializedTeaching
{
    class: ISerializedClass;
    subject: ISerializedSubject;
}

export default class Teaching implements ISerializable
{
    private constructor(public data: ITeaching)
    {}

    public async serialize(): Promise<ISerializedTeaching>
    {
        const { data: teachingClass } = await Class.retrieve(this.data.class);
        const { data: subject } = await Subject.retrieve(this.data.subject);

        return {
            class: await teachingClass!.serialize(),
            subject: await subject!.serialize(),
        };
    }

    public static async create(data: ITeaching): Promise<ApiOperationResult<Teaching>>
    {
        const db = await Database.connect();

        const result = new ApiOperationResult<Teaching>();

        await db.query(
            "INSERT INTO teachings (teacher, class, subject) VALUES ($1, $2, $3)",
            [ data.teacher, data.class, data.subject ]
        );

        result.data = new Teaching(data);

        return result;
    }

    public static async for(teacher: Teacher): Promise<Teaching[]>
    {
        const db = await Database.connect();

        const classes: Teaching[] = [];

        const query = await db.query(
            "SELECT * FROM teachings WHERE teacher=$1",
            [ teacher.data.email ]
        );

        for (const row of query.rows)
        {
            classes.push(new Teaching(row));
        }

        return classes;
    }
}
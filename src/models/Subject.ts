import { ISerializable } from "../common/ISerializable";
import Database from "../utilities/Database";
import Teacher from "./Teacher";

interface ISubject
{
    name: string;
    description: string;
}

export interface ISerializedSubject
{
    name: string;
    description: string;
}

export default class Subject implements ISerializable
{
    private constructor(public data: ISubject)
    {}

    public async serialize(): Promise<ISerializedSubject>
    {
        return {
            name: this.data.name,
            description: this.data.description,
        };
    }

    public static async create(data: ISubject): Promise<Subject>
    {
        const db = Database.client;

        await db.query(
            "insert into subjects (name, description) values ($1, $2)",
            [ data.name, data.description ],
        );

        return new Subject(data);
    }

    public static async retrieve(id: string): Promise<Subject | null>
    {
        const db = Database.client;

        const result = await db.query(
            "select * from subjects where name = $1",
            [ id ],
        );

        if (result.rowCount === 0)
        {
            return null;
        }

        return new Subject(result.rows[0]);
    }

    public static async list(): Promise<Subject[]>
    {
        const db = Database.client;

        const result = await db.query("select * from subjects");

        return result.rows.map(_ => new Subject(_));
    }

    public static async for(teacher: Teacher): Promise<Subject[]>
    {
        const db = Database.client;

        const result = await db.query(
            "select s.* from teachings as t inner join subjects as s on s.name = t.subject where t.teacher = $1",
            [ teacher.data.email ],
        );

        return result.rows.map(_ => new Subject(_));
    }

    public async update(data: ISubject): Promise<Subject>
    {
        const db = Database.client;

        this.data.name = data.name ?? this.data.name;
        this.data.description = data.description ?? this.data.description;

        await db.query(
            "update subjects set name = $1, description = $2 where name = $3",
            [ this.data.name, this.data.description, this.data.name ],
        );

        return this;
    }
}
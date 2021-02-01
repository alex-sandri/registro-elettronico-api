import { ISerializable } from "../common/ISerializable";
import Database from "../utilities/Database";

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
}
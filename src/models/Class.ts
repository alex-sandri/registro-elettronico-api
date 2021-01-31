import { ISerializable } from "../common/ISerializable";
import Database from "../utilities/Database";
import Teacher from "./Teacher";

interface IClass
{
    name: string;
}

export interface ISerializedClass
{
    name: string;
}

export default class Class implements ISerializable
{
    private constructor(public data: IClass)
    {}

    public async serialize(): Promise<ISerializedClass>
    {
        return {
            name: this.data.name,
        };
    }

    public static async create(data: IClass): Promise<Class>
    {
        const db = Database.client;

        await db.query(
            "insert into classes (name) values ($1)",
            [ data.name ],
        );

        return new Class(data);
    }

    public static async retrieve(id: string): Promise<Class | null>
    {
        const db = Database.client;

        const result = await db.query(
            "select * from classes where name = $1",
            [ id ],
        );

        if (result.rowCount === 0)
        {
            return null;
        }

        return new Class(result.rows[0]);
    }

    public static async list(): Promise<Class[]>
    {
        const db = Database.client;

        const result = await db.query("select * from classes");

        return result.rows.map(_ => new Class(_));
    }

    public static async for(teacher: Teacher): Promise<Class[]>
    {
        const db = Database.client;

        const result = await db.query(
            "select * from teachings as t inner join classes as c on c.name = t.class where t.teacher=$1",
            [ teacher.data.email ],
        );

        return result.rows.map(_ => new Class(_.Class));
    }
}
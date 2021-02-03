import { ISerializable } from "../common/ISerializable";
import Database from "../utilities/Database";
import User, { ISerializedUser, IUpdateUser, IUser } from "./User";

interface ITeacher extends IUser
{
    type: "teacher";
}

interface IUpdateTeacher extends IUpdateUser
{}

export interface ISerializedTeacher extends ISerializedUser
{}

export default class Teacher extends User implements ISerializable
{
    protected constructor(public data: ITeacher)
    {
        super({
            type: "teacher",
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            password: data.password,
            birthday: data.birthday,
        });
    }

    public async serialize(): Promise<ISerializedTeacher>
    {
        return {
            ...await super.serialize(),
        };
    }

    public static async create(data: ITeacher): Promise<Teacher>
    {
        const db = Database.client;

        await super.create({
            type: "teacher",
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            password: data.password,
            birthday: data.birthday,
        });

        await db.query(
            "insert into teachers (email) values ($1)",
            [ data.email ],
        );

        return new Teacher({ ...data, type: "teacher" });
    }

    public static async retrieve(id: string): Promise<Teacher | null>
    {
        const db = Database.client;

        const result = await db.query(
            "select * from users natural join teachers where email = $1",
            [ id ],
        );

        if (result.rowCount === 0)
        {
            return null;
        }

        return new Teacher(result.rows[0]);
    }

    public static async list(): Promise<Teacher[]>
    {
        const db = Database.client;

        const result = await db.query("select * from users natural join teachers");

        return result.rows.map(_ => new Teacher(_));
    }

    public async update(data: IUpdateTeacher): Promise<Teacher>
    {
        await super.update({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            password: data.password,
        });

        return this;
    }
}
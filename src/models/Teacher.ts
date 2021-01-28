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
        });

        await db.teacher.create({
            data: {
                User: {
                    connect: {
                        email: data.email,
                    },
                },
            },
        });

        return new Teacher(data);
    }

    public static async retrieve(id: string): Promise<Teacher | null>
    {
        const user = await super.retrieve(id);

        if (!user || user.data.type !== "teacher")
        {
            return null;
        }

        return new Teacher({ ...user.data, type: "teacher" });
    }

    public static async list(): Promise<Teacher[]>
    {
        const teachers = await super.list();

        return teachers
            .filter(_ => _.data.type === "teacher")
            .map(_ => new Teacher({ ..._.data, type: "teacher" }));
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
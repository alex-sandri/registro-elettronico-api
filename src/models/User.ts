import ISerializable from "../common/ISerializable";
import { USER_CREATE_SCHEMA, USER_UPDATE_SCHEMA } from "../common/Schemas";
import Database from "../utilities/Database";
import Utilities from "../utilities/Utilities";

export type TUserType = "admin" | "student" | "teacher";

export interface IUser
{
    type: TUserType;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

export interface IUpdateUser
{
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
}

export interface ISerializedUser
{
    type: TUserType;
    firstName: string;
    lastName: string;
    email: string;
}

export default class User implements ISerializable
{
    protected constructor(public data: IUser)
    {}

    public async serialize(): Promise<ISerializedUser>
    {
        return {
            type: this.data.type,
            firstName: this.data.firstName,
            lastName: this.data.lastName,
            email: this.data.email,
        };
    }

    public static async create(data: IUser): Promise<User>
    {
        const result = USER_CREATE_SCHEMA.validate(data);

        if (result.error)
        {
            throw new Error(result.error.message);
        }

        const db = Database.client;

        data.password = Utilities.hash(data.password);

        await db.user.create({ data });

        return new User(data);
    }

    public static async retrieve(id: string): Promise<User | null>
    {
        const db = Database.client;

        const user = await db.user.findUnique({
            where: {
                email: id,
            },
        });

        if (!user)
        {
            return null;
        }

        return new User(user);
    }

    public async update(data: IUpdateUser): Promise<User>
    {
        const result = USER_UPDATE_SCHEMA.validate(data);

        if (result.error)
        {
            throw new Error(result.error.message);
        }

        const db = Database.client;

        let password: string | undefined;

        if (data.password)
        {
            password = Utilities.hash(data.password);
        }

        this.data.firstName = data.firstName ?? this.data.firstName;
        this.data.lastName = data.lastName ?? this.data.lastName;
        this.data.email = data.email ?? this.data.email;
        this.data.password = password ?? this.data.password;

        await db.user.update({ where: { email: this.data.email }, data });

        return this;
    }
}
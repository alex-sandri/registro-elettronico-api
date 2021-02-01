import { ISerializable } from "../common/ISerializable";
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
        const db = Database.client;

        data.password = Utilities.hash(data.password);

        await db.query(
            `insert into users ("type", "firstName", "lastName", "email", "password") values ($1, $2, $3, $4, $5)`,
            [ data.type, data.firstName, data.lastName, data.email, data.password ],
        );

        return new User(data);
    }

    public static async retrieve(id: string): Promise<User | null>
    {
        const db = Database.client;

        const result = await db.query(
            "select * from users where email = $1",
            [ id ],
        );

        if (result.rowCount === 0)
        {
            return null;
        }

        return new User(result.rows[0]);
    }

    public static async list(): Promise<User[]>
    {
        const db = Database.client;

        const result = await db.query("select * from users");

        return result.rows.map(_ => new User(_));
    }

    public async update(data: IUpdateUser): Promise<User>
    {
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

        await db.query(
            `update users set "firstName" = $1, "lastName" = $2, "email" = $3, "password" = $4 where "email" = $`,
            [ this.data.firstName, this.data.lastName, this.data.email, this.data.password, this.data.email ],
        );

        return this;
    }

    public async delete(): Promise<void>
    {
        const db = Database.client;

        await db.query(
            "delete from users where email = $1",
            [ this.data.email ],
        );
    }
}
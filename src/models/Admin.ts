/**
 * RIGHT NOW THIS CLASS IS JUST A WRAPPER AROUND USER
 * NO ADDITIONAL TABLES ARE INVOLVED
 * 
 * IN THE FUTURE THINGS MIGHT CHANGE SO I'M KEEPING
 * THIS CLASS AROUND
 */

import { ISerializable } from "../common/ISerializable";
import Database from "../utilities/Database";
import User, { ISerializedUser, IUpdateUser, IUser } from "./User";

interface IAdmin extends IUser
{
    type: "admin";
}

interface IUpdateAdmin extends IUpdateUser
{}

export interface ISerializedAdmin extends ISerializedUser
{}

export default class Admin extends User implements ISerializable
{
    protected constructor(public data: IAdmin)
    {
        super({
            type: "admin",
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            password: data.password,
        });
    }

    public async serialize(): Promise<ISerializedAdmin>
    {
        return {
            ...await super.serialize(),
        };
    }

    public static async create(data: IAdmin): Promise<Admin>
    {
        await super.create({
            type: "admin",
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            password: data.password,
        });

        return new Admin(data);
    }

    public static async retrieve(id: string): Promise<Admin | null>
    {
        const db = Database.client;

        const result = await db.query(
            "select * from users where type = 'admin' and email = $1",
            [ id ],
        );

        if (result.rowCount === 0)
        {
            return null;
        }

        return new Admin(result.rows[0]);
    }

    public static async list(): Promise<Admin[]>
    {
        const db = Database.client;

        const result = await db.query("select * from users where type = 'admin'");

        return result.rows.map(_ => new Admin(_));
    }

    public async update(data: IUpdateAdmin): Promise<Admin>
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
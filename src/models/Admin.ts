/**
 * RIGHT NOW THIS CLASS IS JUST A WRAPPER AROUND USER
 * NO ADDITIONAL TABLES ARE INVOLVED
 * 
 * IN THE FUTURE THINGS MIGHT CHANGE SO I'M KEEPING
 * THIS CLASS AROUND
 */

import { ISerializable } from "@alex-sandri/api";

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
        const user = await super.retrieve(id);

        if (!user || user.data.type !== "admin")
        {
            return null;
        }

        return new Admin({ ...user.data, type: "admin" });
    }

    public static async list(): Promise<Admin[]>
    {
        const admins = await super.list();

        return admins
            .filter(_ => _.data.type === "admin")
            .map(_ => new Admin({ ..._.data, type: "admin" }));
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
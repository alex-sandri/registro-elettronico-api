import ISerializable from "../common/ISerializable";
import Database from "../utilities/Database";
import Utilities from "../utilities/Utilities";

interface IAdmin
{
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

interface IUpdateAdmin
{
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
}

export interface ISerializedAdmin
{
    firstName: string;
    lastName: string;
    email: string;
}

export default class Admin implements ISerializable
{
    private constructor(public data: IAdmin)
    {}

    public async serialize(): Promise<ISerializedAdmin>
    {
        return {
            firstName: this.data.firstName,
            lastName: this.data.lastName,
            email: this.data.email,
        };
    }

    public static async create(data: IAdmin): Promise<Admin>
    {
        const db = Database.client;

        await db.admin.create({
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                password: Utilities.hash(data.password),
            },
        });

        return new Admin(data);
    }

    public static async retrieve(id: string): Promise<Admin | null>
    {
        const db = Database.client;

        const admin = await db.admin.findUnique({
            where: {
                email: id,
            },
        });

        if (!admin)
        {
            return null;
        }

        return new Admin(admin);
    }

    public async update(data: IUpdateAdmin): Promise<Admin>
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

        await db.admin.update({
            where: {
                email: this.data.email,
            },
            data: {
                firstName: this.data.firstName,
                lastName: this.data.lastName,
                email: this.data.email,
                password: this.data.password,
            },
        });

        return this;
    }
}
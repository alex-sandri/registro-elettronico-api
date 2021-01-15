import { PrismaClient } from "@prisma/client";
import ISerializable from "../common/ISerializable";
import Utilities from "../utilities/Utilities";
import Teaching, { ISerializedTeaching } from "./Teaching";

interface ITeacher
{
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

interface IUpdateTeacher
{
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
}

export interface ISerializedTeacher
{
    firstName: string;
    lastName: string;
    email: string;
    teachings: ISerializedTeaching[];
}

export default class Teacher implements ISerializable
{
    private constructor(public data: ITeacher)
    {}

    public async serialize(): Promise<ISerializedTeacher>
    {
        const teachings = await Teaching.for(this);

        return {
            firstName: this.data.firstName,
            lastName: this.data.lastName,
            email: this.data.email,
            teachings: await Promise.all(teachings.map(_ => _.serialize())),
        };
    }

    public static async create(data: ITeacher): Promise<Teacher>
    {
        const db = new PrismaClient();

        await db.teacher.create({
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                password: Utilities.hash(data.password),
            },
        });

        return new Teacher(data);
    }

    public static async retrieve(id: string): Promise<Teacher>
    {
        const db = new PrismaClient();

        const teacher = await db.teacher.findUnique({
            where: {
                email: id,
            },
        });

        if (!teacher)
        {
            throw new Error("This teacher does not exist");
        }

        return new Teacher(teacher);
    }

    public async update(data: IUpdateTeacher): Promise<Teacher>
    {
        const db = new PrismaClient();

        let password: string | undefined;

        if (data.password)
        {
            password = Utilities.hash(data.password);
        }

        this.data.firstName = data.firstName ?? this.data.firstName;
        this.data.lastName = data.lastName ?? this.data.lastName;
        this.data.email = data.email ?? this.data.email;
        this.data.password = password ?? this.data.password;

        await db.teacher.update({
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
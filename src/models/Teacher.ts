import { PrismaClient } from "@prisma/client";
import ApiOperationResult from "../common/ApiOperationResult";
import ISerializable from "../common/ISerializable";
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

    public static async create(data: ITeacher): Promise<ApiOperationResult<Teacher>>
    {
        const db = new PrismaClient();

        const result = new ApiOperationResult<Teacher>();

        await db.teacher.create({
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                password: data.password,
            },
        });

        result.data = new Teacher(data);

        return result;
    }

    public static async retrieve(id: string): Promise<ApiOperationResult<Teacher>>
    {
        const db = new PrismaClient();

        const result = new ApiOperationResult<Teacher>();

        const teacher = await db.teacher.findUnique({
            where: {
                email: id,
            },
        });

        if (!teacher)
        {
            throw new Error("This teacher does not exist");
        }

        result.data = new Teacher(teacher);

        return result;
    }

    public async update(data: IUpdateTeacher): Promise<ApiOperationResult<Teacher>>
    {
        const db = new PrismaClient();

        const result = new ApiOperationResult<Teacher>();

        this.data.firstName = data.firstName ?? this.data.firstName;
        this.data.lastName = data.lastName ?? this.data.lastName;
        this.data.email = data.email ?? this.data.email;
        this.data.password = data.password ?? this.data.password; // TODO: Encrypt it

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

        result.data = this;

        return result;
    }
}
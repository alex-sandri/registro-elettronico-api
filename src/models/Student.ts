import ISerializable from "../common/ISerializable";
import { STUDENT_CREATE_SCHEMA, STUDENT_UPDATE_SCHEMA } from "../config/Schemas";
import Database from "../utilities/Database";
import Class, { ISerializedClass } from "./Class";
import Grade, { ISerializedGrade } from "./Grade";
import User, { ISerializedUser, IUpdateUser, IUser } from "./User";

interface IStudent extends IUser
{
    type: "student";
    class: string;
}

interface IUpdateStudent extends IUpdateUser
{
    class?: string;
}

export interface ISerializedStudent extends ISerializedUser
{
    grades: ISerializedGrade[];
    class: ISerializedClass;
}

export default class Student extends User implements ISerializable
{
    protected constructor(public data: IStudent)
    {
        super({
            type: "student",
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            password: data.password,
        });
    }

    public async serialize(): Promise<ISerializedStudent>
    {
        const grades = await Grade.for(this);

        const studentClass = await Class.retrieve(this.data.class);

        return {
            ...await super.serialize(),
            grades: await Promise.all(grades.map(_ => _.serialize())),
            class: await studentClass!.serialize(false),
        };
    }

    public static async create(data: IStudent): Promise<Student>
    {
        const result = STUDENT_CREATE_SCHEMA.validate(data);

        if (result.error)
        {
            throw new Error(result.error.message);
        }

        const db = Database.client;

        await super.create({
            type: "student",
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            password: data.password,
        });

        await db.student.create({
            data: {
                User: {
                    connect: {
                        email: data.email,
                    },
                },
                Class: {
                    connect: {
                        name: data.class,
                    },
                },
            },
        });

        return new Student(data);
    }

    public static async retrieve(id: string): Promise<Student | null>
    {
        const db = Database.client;

        const user = await super.retrieve(id);

        if (!user || user.data.type !== "student")
        {
            return null;
        }

        const student = await db.student.findUnique({
            where: {
                email: id,
            },
        });

        if (!student)
        {
            return null;
        }

        return new Student({ ...user.data, ...student, type: "student" });
    }

    public async update(data: IUpdateStudent): Promise<Student>
    {
        const result = STUDENT_UPDATE_SCHEMA.validate(data);

        if (result.error)
        {
            throw new Error(result.error.message);
        }

        const db = Database.client;

        await super.update({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            password: data.password,
        });

        this.data.class = data.class ?? this.data.password;

        await db.student.update({
            where: {
                email: this.data.email,
            },
            data: {
                Class: {
                    connect: {
                        name: this.data.class,
                    },
                },
            },
        });

        return this;
    }

    public static async for(studentClass: Class): Promise<Student[]>
    {
        const db = Database.client;

        const students = await db.student.findMany({
            where: {
                class: studentClass.data.name,
            },
            include: {
                User: true,
            },
        });

        return students.map(_ => new Student({ ..._.User, class: _.class, type: "student" }));
    }
}
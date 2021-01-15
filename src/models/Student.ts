import { PrismaClient } from "@prisma/client";
import ISerializable from "../common/ISerializable";
import Class, { ISerializedClass } from "./Class";
import Grade, { ISerializedGrade } from "./Grade";

interface IStudent
{
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    class: string;
}

interface IUpdateStudent
{
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    class?: string;
}

interface ISerializedStudent
{
    firstName: string;
    lastName: string;
    email: string;
    grades: ISerializedGrade[];
    class: ISerializedClass;
}

export default class Student implements ISerializable
{
    private constructor(public data: IStudent)
    {}

    public async serialize(): Promise<ISerializedStudent>
    {
        const grades = await Grade.for(this);

        const studentClass = await Class.retrieve(this.data.class);

        return {
            firstName: this.data.firstName,
            lastName: this.data.lastName,
            email: this.data.email,
            grades: await Promise.all(grades.map(_ => _.serialize())),
            class: await studentClass.serialize(),
        };
    }

    public static async create(data: IStudent): Promise<Student>
    {
        const db = new PrismaClient();

        await db.student.create({
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                password: data.password, // TODO: Encrypt
                Class: {
                    connect: {
                        name: data.class,
                    },
                },
            },
        });

        return new Student(data);
    }

    public static async retrieve(id: string): Promise<Student>
    {
        const db = new PrismaClient();

        const student = await db.student.findUnique({
            where: {
                email: id,
            },
        });

        if (!student)
        {
            throw new Error("This student does not exist");
        }

        return new Student(student);
    }

    public async update(data: IUpdateStudent): Promise<Student>
    {
        const db = new PrismaClient();

        this.data.firstName = data.firstName ?? this.data.firstName;
        this.data.lastName = data.lastName ?? this.data.lastName;
        this.data.email = data.email ?? this.data.email;
        this.data.password = data.password ?? this.data.password; // TODO: Encrypt it

        await db.student.update({
            where: {
                email: this.data.email,
            },
            data: {
                firstName: this.data.firstName,
                lastName: this.data.lastName,
                email: this.data.email,
                password: this.data.password,
                Class: {
                    connect: {
                        name: this.data.class,
                    },
                },
            },
        });

        return this;
    }
}
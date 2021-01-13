import { firestore } from "firebase-admin";
import ISerializable from "../common/ISerializable";
import Class, { ISerializedClass } from "./Class";
import Grade, { ISerializedGrade } from "./Grade";

const db = firestore();

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
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    grades: ISerializedGrade[];
    class: ISerializedClass;
}

export default class Student implements ISerializable
{
    private constructor(public id: string, public data: IStudent)
    {}

    public async serialize(): Promise<ISerializedStudent>
    {
        const grades = await Grade.for(this);

        const studentClass = await Class.retrieve(this.data.class);

        return {
            id: this.id,
            firstName: this.data.firstName,
            lastName: this.data.lastName,
            email: this.data.email,
            grades: await Promise.all(grades.map(_ => _.serialize())),
            class: await studentClass.serialize(),
        };
    }

    public static async create(data: IStudent): Promise<Student>
    {
        const { id } = await db.collection("students").add(data);

        return new Student(id, data);
    }

    public static async retrieve(id: string): Promise<Student>
    {
        const snapshot = await db.collection("students").doc(id).get();

        return new Student(id, snapshot.data() as IStudent);
    }

    public async update(data: IUpdateStudent): Promise<Student>
    {
        this.data.firstName = data.firstName ?? this.data.firstName;
        this.data.lastName = data.lastName ?? this.data.lastName;
        this.data.email = data.email ?? this.data.email;
        this.data.password = data.password ?? this.data.password; // TODO: Encrypt it

        await db.collection("students").doc(this.id).update(this.data);

        return this;
    }
}
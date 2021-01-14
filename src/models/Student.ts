import { firestore } from "firebase-admin";
import ApiOperationResult from "../common/ApiOperationResult";
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

        const { data: studentClass } = await Class.retrieve(this.data.class);

        return {
            id: this.id,
            firstName: this.data.firstName,
            lastName: this.data.lastName,
            email: this.data.email,
            grades: await Promise.all(grades.map(_ => _.serialize())),
            class: await studentClass!.serialize(),
        };
    }

    public static async create(data: IStudent): Promise<ApiOperationResult<Student>>
    {
        const result = new ApiOperationResult<Student>();

        const { id } = await db.collection("students").add(data);

        result.data = new Student(id, data);

        return result;
    }

    public static async retrieve(id: string): Promise<ApiOperationResult<Student>>
    {
        const result = new ApiOperationResult<Student>();

        const snapshot = await db.collection("students").doc(id).get();

        result.data = new Student(id, snapshot.data() as IStudent);

        return result;
    }

    public async update(data: IUpdateStudent): Promise<ApiOperationResult<Student>>
    {
        const result = new ApiOperationResult<Student>();

        this.data.firstName = data.firstName ?? this.data.firstName;
        this.data.lastName = data.lastName ?? this.data.lastName;
        this.data.email = data.email ?? this.data.email;
        this.data.password = data.password ?? this.data.password; // TODO: Encrypt it

        await db.collection("students").doc(this.id).update(this.data);

        result.data = this;

        return result;
    }
}
import { firestore } from "firebase-admin";
import ISerializable from "../common/ISerializable";
import Grade, { ISerializedGrade } from "./Grade";

const db = firestore();

interface IUser
{
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

interface IUpdateUser
{
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
}

interface ISerializedUser
{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    grades: ISerializedGrade[];
}

export default class User implements ISerializable
{
    private constructor(public id: string, public data: IUser)
    {}

    public async serialize(): Promise<ISerializedUser>
    {
        const grades = await Grade.for(this);

        const serializedGrades: ISerializedGrade[] = [];

        for (const grade of grades)
        {
            serializedGrades.push(await grade.serialize());
        }

        return {
            id: this.id,
            firstName: this.data.firstName,
            lastName: this.data.lastName,
            email: this.data.email,
            grades: serializedGrades,
        };
    }

    public static async create(data: IUser): Promise<User>
    {
        const { id } = await db.collection("users").add(data);

        return new User(id, data);
    }

    public static async retrieve(id: string): Promise<User>
    {
        const snapshot = await db.collection("users").doc(id).get();

        return new User(id, snapshot.data() as IUser);
    }

    public async update(data: IUpdateUser): Promise<User>
    {
        this.data.firstName = data.firstName ?? this.data.firstName;
        this.data.lastName = data.lastName ?? this.data.lastName;
        this.data.email = data.email ?? this.data.email;
        this.data.password = data.password ?? this.data.password; // TODO: Encrypt it

        await db.collection("users").doc(this.id).update(this.data);

        return this;
    }
}
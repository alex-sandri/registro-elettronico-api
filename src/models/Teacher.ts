import { firestore } from "firebase-admin";
import ISerializable from "../common/ISerializable";
import Class, { ISerializedClass } from "./Class";

const db = firestore();

interface ITeacher
{
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

interface ISerializedTeacher
{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    classes: ISerializedClass[];
}

export default class Teacher implements ISerializable
{
    private constructor(public id: string, public data: ITeacher)
    {}

    public async serialize(): Promise<ISerializedTeacher>
    {
        const classes = await Class.for(this);

        return {
            id: this.id,
            firstName: this.data.firstName,
            lastName: this.data.lastName,
            email: this.data.email,
            classes: await Promise.all(classes.map(_ => _.serialize())),
        };
    }

    public static async create(data: ITeacher): Promise<Teacher>
    {
        const { id } = await db.collection("teachers").add(data);

        return new Teacher(id, data);
    }

    public static async retrieve(id: string): Promise<Teacher>
    {
        const snapshot = await db.collection("teachers").doc(id).get();

        return new Teacher(id, snapshot.data() as ITeacher);
    }
}
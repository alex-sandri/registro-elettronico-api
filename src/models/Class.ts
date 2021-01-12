import { firestore } from "firebase-admin";
import ISerializable from "../common/ISerializable";
import Teacher from "./Teacher";

const db = firestore();

interface IClass
{
    description: string;
}

export interface ISerializedClass
{
    id: string;
    description: string;
}

export default class Class implements ISerializable
{
    private constructor(public id: string, public data: IClass)
    {}

    public async serialize(): Promise<ISerializedClass>
    {
        return {
            id: this.id,
            description: this.data.description,
        };
    }

    public static async create(data: IClass): Promise<Class>
    {
        const { id } = await db.collection("classes").add(data);

        return new Class(id, data);
    }

    public static async for(teacher: Teacher): Promise<Class[]>
    {
        const classes: Class[] = [];

        const { docs } = await db.collection("classes_teachers").where("teacher" ,"==", teacher.id).get();

        for (const grade of docs)
        {
            const data = grade.data() as IClass;

            classes.push(new Class(grade.id, data));
        }

        return classes;
    }
}
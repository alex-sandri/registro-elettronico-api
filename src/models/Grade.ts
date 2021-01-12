import { firestore } from "firebase-admin";
import ISerializable from "../common/ISerializable";
import ISerializedDate from "../common/ISerializedDate";
import User from "./User";

const db = firestore();

interface IGrade
{
    user: string;
    value: number;
    date: Date;
    description: string;
}

export interface ISerializedGrade
{
    id: string;
    value: number;
    date: ISerializedDate;
    description: string;
}

export default class Grade implements ISerializable
{
    private constructor(public id: string, public data: IGrade)
    {}

    public async serialize(): Promise<ISerializedGrade>
    {
        return {
            id: this.id,
            value: this.data.value,
            date: {
                day: this.data.date.getDate(),
                month: this.data.date.getMonth() + 1,
                year: this.data.date.getFullYear()
            },
            description: this.data.description,
        };
    }

    public static async create(data: IGrade): Promise<Grade>
    {
        const { id } = await db.collection("grades").add(data);

        return new Grade(id, data);
    }

    public static async for(user: User): Promise<Grade[]>
    {
        const grades: Grade[] = [];

        const { docs } = await db.collection("grades").where("user" ,"==", user.id).get();

        for (const grade of docs)
        {
            grades.push(new Grade(grade.id, grade.data() as IGrade));
        }

        return grades;
    }
}
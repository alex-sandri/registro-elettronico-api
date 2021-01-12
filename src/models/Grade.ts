import { firestore } from "firebase-admin";
import ISerializable from "../interfaces/ISerializable";
import User from "./User";

const db = firestore();

interface IGrade
{
    value: number;
    date: Date;
    description: string;
}

interface ISerializedGrade
{
    id: string;
    value: number;
    date: Date;
    description: string;
}

export default class Grade implements ISerializable
{
    private constructor(public id: string, public data: IGrade)
    {}

    public serialize(): ISerializedGrade
    {
        return { id: this.id, ...this.data };
    }

    public static async assign(user: User, data: IGrade): Promise<Grade>
    {
        const { id } = await db.collection("grades").add(data);

        return new Grade(id, data);
    }
}
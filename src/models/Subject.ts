import { firestore } from "firebase-admin";
import ApiOperationResult from "../common/ApiOperationResult";
import ISerializable from "../common/ISerializable";

const db = firestore();

interface ISubject
{
    name: string;
    description: string;
}

interface ISerializedSubject
{
    id: string;
    name: string;
    description: string;
}

export default class Subject implements ISerializable
{
    private constructor(public id: string, public data: ISubject)
    {}

    public async serialize(): Promise<ISerializedSubject>
    {
        return {
            id: this.id,
            name: this.data.name,
            description: this.data.description,
        };
    }

    public static async create(data: ISubject): Promise<ApiOperationResult<Subject>>
    {
        const result = new ApiOperationResult<Subject>();

        const { id } = await db.collection("subjects").add(data);

        result.data = new Subject(id, data);

        return result;
    }

    public static async retrieve(id: string): Promise<ApiOperationResult<Subject>>
    {
        const result = new ApiOperationResult<Subject>();

        const snapshot = await db.collection("subjects").doc(id).get();

        result.data = new Subject(id, snapshot.data() as ISubject);

        return result;
    }
}
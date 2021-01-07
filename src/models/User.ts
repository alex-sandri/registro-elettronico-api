import { firestore } from "firebase-admin";

const db = firestore();

export interface IUser
{
    name: {
        first: string;
        last: string;
    };
}

export default class User
{
    private constructor(public id: string, public data: IUser)
    {}

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

    public async update(data: IUser): Promise<User>
    {
        await db.collection("users").doc(this.id).update(data);

        this.data = data;

        return this;
    }
}
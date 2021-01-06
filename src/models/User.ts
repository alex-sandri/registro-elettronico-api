import { firestore } from "firebase-admin";

const db = firestore();

export default class User
{
    public static async retrieve(id: string)
    {
        const snapshot = await db.collection("users").doc(id).get();

        return snapshot.data();
    }
}
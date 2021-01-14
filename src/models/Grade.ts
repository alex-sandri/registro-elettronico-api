import { firestore } from "firebase-admin";
import ApiOperationResult from "../common/ApiOperationResult";
import ISerializable from "../common/ISerializable";
import Student from "./Student";

const db = firestore();

interface IGrade
{
    student: string;
    value: number;
    date: Date;
    description: string;
}

export interface ISerializedGrade
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

    public async serialize(): Promise<ISerializedGrade>
    {
        return {
            id: this.id,
            value: this.data.value,
            date: this.data.date,
            description: this.data.description,
        };
    }

    public static async create(data: IGrade): Promise<ApiOperationResult<Grade>>
    {
        const result = new ApiOperationResult<Grade>();

        const student = Student.retrieve(data.student);

        if (!student)
        {
            return null;
        }

        const { id } = await db.collection("grades").add(data);

        result.data = new Grade(id, data);

        return result;
    }

    public static async for(student: Student): Promise<Grade[]>
    {
        const grades: Grade[] = [];

        const { docs } = await db.collection("grades").where("student" ,"==", student.id).get();

        for (const grade of docs)
        {
            const data = grade.data() as IGrade;

            // Firestore converts it to a Timestamp
            data.date = (data.date as unknown as firestore.Timestamp).toDate();

            grades.push(new Grade(grade.id, data));
        }

        return grades;
    }
}
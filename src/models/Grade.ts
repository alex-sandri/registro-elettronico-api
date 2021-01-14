import ApiOperationResult from "../common/ApiOperationResult";
import ISerializable from "../common/ISerializable";
import Database from "../utilities/Database";
import Student from "./Student";

interface IGrade
{
    student: string;
    value: number;
    date: Date;
    description: string;
}

export interface ISerializedGrade
{
    value: number;
    date: Date;
    description: string;
}

export default class Grade implements ISerializable
{
    private constructor(public data: IGrade)
    {}

    public async serialize(): Promise<ISerializedGrade>
    {
        return {
            value: this.data.value,
            date: this.data.date,
            description: this.data.description,
        };
    }

    public static async create(data: IGrade): Promise<ApiOperationResult<Grade>>
    {
        const db = await Database.connect();

        const result = new ApiOperationResult<Grade>();

        const student = await Student.retrieve(data.student);

        if (!student.data)
        {
            result.errors = [ { id: "student/inexistent", message: "This student does not exist" } ];

            return result;
        }

        await db.query(
            "INSERT INTO grades (value, date, description, student) VALUES (?, ?, ?, ?)",
            [ data.value, data.date, data.description, data.student ]
        );

        result.data = new Grade(data);

        return result;
    }

    public static async for(student: Student): Promise<Grade[]>
    {
        const db = await Database.connect();

        const grades: Grade[] = [];

        const query = await db.query(
            "SELECT * FROM grades WHERE student=?",
            [ student.id ]
        );

        for (const row of query.rows)
        {
            grades.push(new Grade(row));
        }

        return grades;
    }
}
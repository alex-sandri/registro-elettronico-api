import ApiOperationResult from "../common/ApiOperationResult";
import ISerializable from "../common/ISerializable";
import Database from "../utilities/Database";

interface ISubject
{
    name: string;
    description: string;
}

interface ISerializedSubject
{
    name: string;
    description: string;
}

export default class Subject implements ISerializable
{
    private constructor(public data: ISubject)
    {}

    public async serialize(): Promise<ISerializedSubject>
    {
        return {
            name: this.data.name,
            description: this.data.description,
        };
    }

    public static async create(data: ISubject): Promise<ApiOperationResult<Subject>>
    {
        const db = await Database.connect();

        const result = new ApiOperationResult<Subject>();

        await db.query(
            "INSERT INTO subjects (name, description) VALUES (?, ?)",
            [ data.name, data.description ]
        );

        result.data = new Subject(data);

        return result;
    }

    public static async retrieve(id: string): Promise<ApiOperationResult<Subject>>
    {
        const db = await Database.connect();

        const result = new ApiOperationResult<Subject>();

        const query = await db.query(
            "SELECT * FROM subjects WHERE name=?",
            [ id ]
        );

        result.data = new Subject(query.rows[0]);

        return result;
    }
}
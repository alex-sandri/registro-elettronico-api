import ApiOperationResult from "../common/ApiOperationResult";
import ISerializable from "../common/ISerializable";
import Database from "../utilities/Database";

interface IClass
{
    name: string;
}

export interface ISerializedClass
{
    name: string;
}

export default class Class implements ISerializable
{
    private constructor(public data: IClass)
    {}

    public async serialize(): Promise<ISerializedClass>
    {
        return {
            name: this.data.name,
        };
    }

    public static async create(data: IClass): Promise<ApiOperationResult<Class>>
    {
        const db = await Database.connect();

        const result = new ApiOperationResult<Class>();

        await db.query(
            "INSERT INTO classes (name) VALUES ($1)",
            [ data.name ]
        );

        result.data = new Class(data);

        return result;
    }

    public static async retrieve(id: string): Promise<ApiOperationResult<Class>>
    {
        const db = await Database.connect();

        const result = new ApiOperationResult<Class>();

        const query = await db.query(
            "SELECT * FROM classes WHERE name=$1",
            [ id ]
        );

        result.data = new Class(query.rows[0]);

        return result;
    }
}
import ApiOperationResult from "../common/ApiOperationResult";
import ISerializable from "../common/ISerializable";
import Database from "../utilities/Database";
import Teacher from "./Teacher";

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

    public static async create(data: IClass): Promise<ApiOperationResult<Class>>
    {
        const db = await Database.connect();

        const result = new ApiOperationResult<Class>();

        const { id } = await db.collection("classes").add(data);

        result.data = new Class(id, data);

        return result;
    }

    public static async retrieve(id: string): Promise<ApiOperationResult<Class>>
    {
        const db = await Database.connect();

        const result = new ApiOperationResult<Class>();

        const snapshot = await db.collection("classes").doc(id).get();

        result.data = new Class(id, snapshot.data() as IClass);

        return result;
    }

    public static async for(teacher: Teacher): Promise<Class[]>
    {
        const db = await Database.connect();

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
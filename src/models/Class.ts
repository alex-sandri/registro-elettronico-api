import { PrismaClient } from "@prisma/client";
import ApiOperationResult from "../common/ApiOperationResult";
import ISerializable from "../common/ISerializable";

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
        const db = new PrismaClient();

        const result = new ApiOperationResult<Class>();

        await db.class.create({
            data: {
                name: data.name,
            },
        });

        result.data = new Class(data);

        return result;
    }

    public static async retrieve(id: string): Promise<ApiOperationResult<Class>>
    {
        const db = new PrismaClient();

        const result = new ApiOperationResult<Class>();

        const retrievedClass = await db.class.findUnique({
            where: {
                name: id,
            },
        });

        if (!retrievedClass)
        {
            result.errors = [ { id: "class/inexistent", message: "This class does not exist" } ];

            return result;
        }

        result.data = new Class(retrievedClass);

        return result;
    }
}
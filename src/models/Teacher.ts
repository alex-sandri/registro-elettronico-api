import ApiOperationResult from "../common/ApiOperationResult";
import ISerializable from "../common/ISerializable";
import Database from "../utilities/Database";
import Class, { ISerializedClass } from "./Class";

interface ITeacher
{
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

interface IUpdateTeacher
{
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
}

interface ISerializedTeacher
{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    classes: ISerializedClass[];
}

export default class Teacher implements ISerializable
{
    private constructor(public id: string, public data: ITeacher)
    {}

    public async serialize(): Promise<ISerializedTeacher>
    {
        const classes = await Class.for(this);

        return {
            id: this.id,
            firstName: this.data.firstName,
            lastName: this.data.lastName,
            email: this.data.email,
            classes: await Promise.all(classes.map(_ => _.serialize())),
        };
    }

    public static async create(data: ITeacher): Promise<ApiOperationResult<Teacher>>
    {
        const db = await Database.connect();

        const result = new ApiOperationResult<Teacher>();

        const { id } = await db.collection("teachers").add(data);

        result.data = new Teacher(id, data);

        return result;
    }

    public static async retrieve(id: string): Promise<ApiOperationResult<Teacher>>
    {
        const db = await Database.connect();

        const result = new ApiOperationResult<Teacher>();

        const snapshot = await db.collection("teachers").doc(id).get();

        result.data = new Teacher(id, snapshot.data() as ITeacher);

        return result;
    }

    public async update(data: IUpdateTeacher): Promise<ApiOperationResult<Teacher>>
    {
        const db = await Database.connect();

        const result = new ApiOperationResult<Teacher>();

        this.data.firstName = data.firstName ?? this.data.firstName;
        this.data.lastName = data.lastName ?? this.data.lastName;
        this.data.email = data.email ?? this.data.email;
        this.data.password = data.password ?? this.data.password; // TODO: Encrypt it

        await db.collection("teachers").doc(this.id).update(this.data);

        result.data = this;

        return result;
    }
}
import ApiOperationResult from "../common/ApiOperationResult";
import ISerializable from "../common/ISerializable";
import Database from "../utilities/Database";
import Teaching, { ISerializedTeaching } from "./Teaching";

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

export interface ISerializedTeacher
{
    firstName: string;
    lastName: string;
    email: string;
    teachings: ISerializedTeaching[];
}

export default class Teacher implements ISerializable
{
    private constructor(public data: ITeacher)
    {}

    public async serialize(): Promise<ISerializedTeacher>
    {
        const teachings = await Teaching.for(this);

        return {
            firstName: this.data.firstName,
            lastName: this.data.lastName,
            email: this.data.email,
            teachings: await Promise.all(teachings.map(_ => _.serialize())),
        };
    }

    public static async create(data: ITeacher): Promise<ApiOperationResult<Teacher>>
    {
        const db = await Database.connect();

        const result = new ApiOperationResult<Teacher>();

        await db.query(
            "INSERT INTO teachers (firstName, lastName, email, password) VALUES ($1, $2, $3, $4)",
            [ data.firstName, data.lastName, data.email, /* TODO: Encrypt password */ data.password ]
        );

        result.data = new Teacher(data);

        return result;
    }

    public static async retrieve(id: string): Promise<ApiOperationResult<Teacher>>
    {
        const db = await Database.connect();

        const result = new ApiOperationResult<Teacher>();

        const query = await db.query(
            "SELECT * FROM teachers WHERE email=$1",
            [ id ]
        );

        result.data = new Teacher(query.rows[0]);

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

        await db.query(
            "UPDATE teachers SET firstName=$1, lastName=$2, email=$3, password=$4 WHERE email=$5",
            [ data.firstName, data.lastName, data.email, data.password, this.data.email ]
        );

        result.data = this;

        return result;
    }
}
import ApiOperationResult from "../common/ApiOperationResult";
import ISerializable from "../common/ISerializable";
import Database from "../utilities/Database";
import Class, { ISerializedClass } from "./Class";
import Grade, { ISerializedGrade } from "./Grade";

interface IStudent
{
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    class: string;
}

interface IUpdateStudent
{
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    class?: string;
}

interface ISerializedStudent
{
    firstName: string;
    lastName: string;
    email: string;
    grades: ISerializedGrade[];
    class: ISerializedClass;
}

export default class Student implements ISerializable
{
    private constructor(public data: IStudent)
    {}

    public async serialize(): Promise<ISerializedStudent>
    {
        const grades = await Grade.for(this);

        const { data: studentClass } = await Class.retrieve(this.data.class);

        return {
            firstName: this.data.firstName,
            lastName: this.data.lastName,
            email: this.data.email,
            grades: await Promise.all(grades.map(_ => _.serialize())),
            class: await studentClass!.serialize(),
        };
    }

    public static async create(data: IStudent): Promise<ApiOperationResult<Student>>
    {
        const db = await Database.connect();

        const result = new ApiOperationResult<Student>();

        const studentClass = await Class.retrieve(data.class);

        if (!studentClass.data)
        {
            result.errors = studentClass.errors;

            return result;
        }

        await db.query(
            "INSERT INTO students (firstName, lastName, email, password, class) VALUES ($1, $2, $3, $4, $5)",
            [ data.firstName, data.lastName, data.email, /* TODO: Encrypt password */ data.password, data.class ]
        );

        result.data = new Student(data);

        return result;
    }

    public static async retrieve(id: string): Promise<ApiOperationResult<Student>>
    {
        const db = await Database.connect();

        const result = new ApiOperationResult<Student>();

        const query = await db.query(
            "SELECT * FROM students WHERE email=$1",
            [ id ]
        );

        if (query.rowCount === 0)
        {
            result.errors = [ { id: "student/inexistent", message: "This student does not exist" } ];

            return result;
        }

        result.data = new Student(query.rows[0]);

        return result;
    }

    public async update(data: IUpdateStudent): Promise<ApiOperationResult<Student>>
    {
        const db = await Database.connect();

        const result = new ApiOperationResult<Student>();

        this.data.firstName = data.firstName ?? this.data.firstName;
        this.data.lastName = data.lastName ?? this.data.lastName;
        this.data.email = data.email ?? this.data.email;
        this.data.password = data.password ?? this.data.password; // TODO: Encrypt it

        await db.query(
            "UPDATE students SET firstName=$1, lastName=$2, email=$3, password=$4, class=$5 WHERE email=$6",
            [ data.firstName, data.lastName, data.email, data.password, data.class, this.data.email ]
        );

        result.data = this;

        return result;
    }
}
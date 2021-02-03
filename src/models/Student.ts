import { ISerializable } from "../common/ISerializable";
import Database from "../utilities/Database";
import Class, { ISerializedClass } from "./Class";
import User, { ISerializedUser, IUpdateUser, IUser } from "./User";

interface IStudent extends IUser
{
    type: "student";
    class: string;
}

interface IUpdateStudent extends IUpdateUser
{
    class?: string;
}

export interface ISerializedStudent extends ISerializedUser
{
    class: ISerializedClass;
}

export default class Student extends User implements ISerializable
{
    protected constructor(public data: IStudent)
    {
        super({
            type: "student",
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            password: data.password,
        });
    }

    public async serialize(): Promise<ISerializedStudent>
    {
        const studentClass = await Class.retrieve(this.data.class);

        return {
            ...await super.serialize(),
            class: await studentClass!.serialize(),
        };
    }

    public static async create(data: IStudent): Promise<Student>
    {
        const db = Database.client;

        if (await Class.retrieve(data.class) === null)
        {
            throw new Error("This class does not exist");
        }

        await super.create({
            type: "student",
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            password: data.password,
        });

        await db.query(
            "insert into students (email, class) values ($1, $2)",
            [ data.email, data.class ],
        );

        return new Student({ ...data, type: "student" });
    }

    public static async retrieve(id: string): Promise<Student | null>
    {
        const db = Database.client;

        const result = await db.query(
            "select * from users natural join students where email = $1",
            [ id ],
        );

        if (result.rowCount === 0)
        {
            return null;
        }

        return new Student(result.rows[0]);
    }

    public static async list(): Promise<Student[]>
    {
        const db = Database.client;

        const result = await db.query("select * from users natural join students");

        return result.rows.map(_ => new Student(_));
    }

    public async update(data: IUpdateStudent): Promise<Student>
    {
        const db = Database.client;

        await super.update({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            password: data.password,
        });

        this.data.class = data.class ?? this.data.password;

        await db.query(
            "update students set class = $1 where email = $2",
            [ this.data.class, this.data.email ],
        );

        return this;
    }

    public static async for(studentClass: Class): Promise<Student[]>
    {
        const db = Database.client;

        const result = await db.query(
            "select s.* from (users natural join students) as s inner join classes as c on s.class = c.name where s.class = $1",
            [ studentClass.data.name ],
        );

        return result.rows.map(_ => new Student(_));
    }

    public async report(): Promise<{ grades: { subject: string; average: number; }[] }>
    {
        const db = Database.client;

        const result = await db.query(
            "select subject, round(avg(value), 2) as average from grades where student = $1 group by subject",
            [ this.data.email ],
        );

        return {
            grades: result.rows.map(row =>
            {
                row.average = parseFloat(row.average);

                return row;
            }),
        };
    }
}
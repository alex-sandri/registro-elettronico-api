import { ISerializable } from "../common/ISerializable";
import Database from "../utilities/Database";
import Student, { ISerializedStudent } from "./Student";
import User, { ISerializedUser } from "./User";

interface ICreateDemerit
{
    content: string;
    student: string;
}

interface IDemerit extends ICreateDemerit
{
    id: string;
    author: string;
    created: Date;
}

export interface ISerializedDemerit
{
    id: string;
    content: string;
    author: ISerializedUser;
    student: ISerializedStudent;
    created: string;
}

export class Demerit implements ISerializable
{
    private constructor(public data: IDemerit)
    {}

    public async serialize(): Promise<ISerializedDemerit>
    {
        const author = await User.retrieve(this.data.author) as User;
        const student = await Student.retrieve(this.data.student) as Student;

        return {
            id: this.data.id,
            content: this.data.content,
            author: await author.serialize(),
            student: await student.serialize(),
            created: this.data.created.toISOString(),
        };
    }

    public static async create(data: ICreateDemerit, author: User): Promise<Demerit>
    {
        const result = await Database.client.query(
            `insert into demerits ("content", "author", "student") values ($1, $2, $3) returning *`,
            [ data.content, author.data.email, data.student ],
        );

        return new Demerit(result.rows[0]);
    }

    public static async retrieve(id: string): Promise<Demerit | null>
    {
        const result = await Database.client.query(
            "select * from demerits where id = $1",
            [ id ],
        );

        if (result.rowCount === 0)
        {
            return null;
        }

        return new Demerit(result.rows[0]);
    }

    public async delete(): Promise<void>
    {
        await Database.client.query(
            "delete from demerits where id = $1",
            [ this.data.id ],
        );
    }

    public static async for(student: Student): Promise<Demerit[]>
    {
        const result = await Database.client.query(
            "select * from demerits where student = $1",
            [ student.data.email ],
        );

        return result.rows.map(_ => new Demerit(_));
    }
}
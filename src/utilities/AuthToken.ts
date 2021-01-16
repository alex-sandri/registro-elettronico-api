import * as jwt from "jsonwebtoken";
import ISerializable from "../common/ISerializable";
import Student, { ISerializedStudent } from "../models/Student";
import Teacher, { ISerializedTeacher } from "../models/Teacher";

export type TAuthTokenType = "admin" | "student"| "teacher";

interface IAuthToken
{
    type: TAuthTokenType;
    user: string;
}

interface ISerializedAuthToken
{
    id: string;
    type: TAuthTokenType;
    user: ISerializedTeacher | ISerializedStudent;
}

export default class AuthToken implements ISerializable
{
    private constructor(
        public readonly id: string,
        public readonly type: TAuthTokenType,
        public readonly user: Teacher | Student,
    ) {}

    public async serialize(): Promise<ISerializedAuthToken>
    {
        return {
            id: this.id,
            type: this.type,
            user: await this.user.serialize(),
        };
    }

    public static async create(data: IAuthToken): Promise<AuthToken>
    {
        let user: Teacher | Student;

        switch (data.type)
        {
            case "admin":
            {
                // TODO
                user = await Teacher.retrieve(data.user);

                break;
            }
            case "student":
            {
                user = await Student.retrieve(data.user);

                break;
            }
            case "teacher":
            {
                user = await Teacher.retrieve(data.user);

                break;
            }
        }

        const id = jwt.sign({ user: user.data.email }, process.env.TOKEN_SECRET!);

        return new AuthToken(id, data.type, user);
    }

    public static async retrieve(id: string): Promise<AuthToken | null>
    {
        let token: string | object;

        try
        {
            token = jwt.verify(id, process.env.TOKEN_SECRET!);
        }
        catch (e)
        {
            return null;
        }

        const data = token as IAuthToken;

        let user: Teacher | Student;

        switch (data.type)
        {
            case "admin":
            {
                // TODO
                user = await Teacher.retrieve(data.user);

                break;
            }
            case "student":
            {
                user = await Student.retrieve(data.user);

                break;
            }
            case "teacher":
            {
                user = await Teacher.retrieve(data.user);

                break;
            }
        }

        if (!user) return null;

        return new AuthToken(id, data.type, user);
    }
}
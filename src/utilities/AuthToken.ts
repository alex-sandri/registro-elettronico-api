import * as jwt from "jsonwebtoken";
import ISerializable from "../common/ISerializable";
import Admin, { ISerializedAdmin } from "../models/Admin";
import Student, { ISerializedStudent } from "../models/Student";
import Teacher, { ISerializedTeacher } from "../models/Teacher";
import Utilities from "./Utilities";

export type TAuthTokenType = "admin" | "student"| "teacher";

interface ICreateAuthToken
{
    type: TAuthTokenType;
    email: string;
    password: string;
}

interface IAuthToken
{
    type: TAuthTokenType;
    user: string;
}

interface ISerializedAuthToken
{
    id: string;
    type: TAuthTokenType;
    user: ISerializedAdmin | ISerializedTeacher | ISerializedStudent;
}

export default class AuthToken implements ISerializable
{
    private constructor(
        public readonly id: string,
        public readonly type: TAuthTokenType,
        public readonly user: Admin | Teacher | Student,
    ) {}

    public async serialize(): Promise<ISerializedAuthToken>
    {
        return {
            id: this.id,
            type: this.type,
            user: await this.user.serialize(),
        };
    }

    public static async create(data: ICreateAuthToken): Promise<AuthToken>
    {
        let user: Admin | Teacher | Student | null;

        switch (data.type)
        {
            case "admin":
            {
                user = await Admin.retrieve(data.email);

                break;
            }
            case "student":
            {
                user = await Student.retrieve(data.email);

                break;
            }
            case "teacher":
            {
                user = await Teacher.retrieve(data.email);

                break;
            }
        }

        if (!user)
        {
            throw new Error(`This ${data.type} does not exist`);
        }

        if (!Utilities.verifyHash(data.password, user.data.password))
        {
            throw new Error("Wrong password");
        }

        const payload: IAuthToken = {
            type: data.type,
            user: user.data.email,
        };

        const id = jwt.sign(payload, process.env.TOKEN_SECRET!);

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

        let user: Admin | Teacher | Student | null;

        switch (data.type)
        {
            case "admin":
            {
                user = await Admin.retrieve(data.user);

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

        if (!user)
        {
            return null;
        }

        return new AuthToken(id, data.type, user);
    }
}
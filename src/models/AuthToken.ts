import * as jwt from "jsonwebtoken";
import ISerializable from "../common/ISerializable";
import User, { ISerializedUser } from "./User";
import Utilities from "../utilities/Utilities";
import { AUTH_TOKEN_CREATE_SCHEMA } from "../common/Schemas";

export type TAuthTokenType = "admin" | "student"| "teacher";

interface ICreateAuthToken
{
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
    user: ISerializedUser;
}

export default class AuthToken implements ISerializable
{
    public readonly type = this.user.data.type;

    private constructor(
        public readonly id: string,
        public readonly user: User,
    ) {}

    public async serialize(): Promise<ISerializedAuthToken>
    {
        return {
            id: this.id,
            type: this.user.data.type,
            user: await this.user.serialize(),
        };
    }

    public static async create(data: ICreateAuthToken): Promise<AuthToken>
    {
        const result = AUTH_TOKEN_CREATE_SCHEMA.validate(data);

        if (result.error)
        {
            throw new Error(result.error.message);
        }

        const user = await User.retrieve(data.email);

        if (!user)
        {
            throw new Error(`This user does not exist`);
        }

        if (!Utilities.verifyHash(data.password, user.data.password))
        {
            throw new Error("Wrong password");
        }

        const payload: IAuthToken = {
            type: user.data.type,
            user: user.data.email,
        };

        const id = jwt.sign(payload, process.env.TOKEN_SECRET!);

        return new AuthToken(id, user);
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

        const user = await User.retrieve(data.user);

        if (!user)
        {
            return null;
        }

        return new AuthToken(id, user);
    }
}
import { AuthenticationError, ForbiddenError } from "apollo-server";
import ISerializable from "../common/ISerializable";
import AuthToken, { TAuthTokenType } from "../models/AuthToken";

export default class Resolver<T extends ISerializable>
{
    private constructor(
        private types: TAuthTokenType[],
        private callback: (args: any, token: AuthToken) => Promise<T>
    )
    {}

    public static init<T extends ISerializable>(
        types: TAuthTokenType[],
        callback: (args: any, token: AuthToken) => Promise<T>
    ): (parent: any, args: any, context: any, info: any) => Promise<void>
    {
        const instance = new Resolver(types, callback);

        return (parent, args, context, info) => instance.use(parent, args, context, info);
    }

    public async use(parent: any, args: any, context: any, info: any): Promise<any>
    {
        const token = await AuthToken.retrieve(context.token);

        if (!token)
        {
            throw new AuthenticationError("Unauthorized");
        }

        if (!this.types.includes(token.type))
        {
            throw new ForbiddenError("Forbidden");
        }

        const result = await this.callback(args, token);

        return result.serialize();
    }
}
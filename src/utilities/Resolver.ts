import ISerializable from "../common/ISerializable";

export default class Resolver<T extends ISerializable>
{
    private constructor(private callback: (args: any) => Promise<T>)
    {}

    public static init<T extends ISerializable>(callback: (args: any) => Promise<T>): (parent: any, args: any, context: any, info: any) => Promise<void>
    {
        const instance = new Resolver(callback);

        return (parent, args, context, info) => instance.use(parent, args, context, info);
    }

    public async use(parent: any, args: any, context: any, info: any): Promise<any>
    {
        const result = await this.callback(args);

        return result.serialize();
    }
}
type TCallbackType = (args: any) => Promise<any>;

export default class Resolver
{
    public constructor(private callback: TCallbackType)
    {}

    public static init(callback: TCallbackType): (parent: any, args: any, context: any, info: any) => Promise<void>
    {
        const middleware = new Resolver(callback);

        return (parent, args, context, info) => middleware.use(parent, args, context, info);
    }

    public async use(parent: any, args: any, context: any, info: any): Promise<any>
    {
        return this.callback(args);
    }
}
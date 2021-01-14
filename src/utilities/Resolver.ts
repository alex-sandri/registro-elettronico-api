import ApiOperationResult from "../common/ApiOperationResult";
import ISerializable from "../common/ISerializable";

export default class Resolver<T extends ISerializable>
{
    public constructor(private callback: (args: any) => Promise<ApiOperationResult<T>>)
    {}

    public async use(parent: any, args: any, context: any, info: any): Promise<any>
    {
        const result = await this.callback(args);

        return result;
    }
}
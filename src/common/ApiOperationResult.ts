import ISerializable from "./ISerializable";

interface ISerializedApiOperationResult
{
    data?: any;
    errors?: IApiOperationResultError[];
}

interface IApiOperationResultError
{
    id: string;
    message: string;
}

export default class ApiOperationResult<T extends ISerializable> implements ISerializable
{
    public data?: T;
    public errors?: IApiOperationResultError[];

    public async serialize(): Promise<ISerializedApiOperationResult>
    {
        return {
            data: await this.data?.serialize(),
            errors: this.errors,
        };
    }
}
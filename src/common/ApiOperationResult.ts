import ISerializable from "./ISerializable";

interface ISerializedApiOperationResult<T>
{
    data?: T;
    errors?: IApiOperationResultError[];
}

interface IApiOperationResultError
{
    id: string;
    message: string;
}

export default class ApiOperationResult<T> implements ISerializable
{
    public data?: T;
    public errors?: IApiOperationResultError[];

    constructor()
    {}

    public async serialize(): Promise<ISerializedApiOperationResult<T>>
    {
        return {
            data: this.data,
            errors: this.errors,
        };
    }
}
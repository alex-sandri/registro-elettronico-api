import ISerializable from "./ISerializable";

interface ISerializedApiOperationResult<T>
{
    data?: T & ISerializable;
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
import ISerializable from "./ISerializable";

interface ISerializedApiOperationResult
{
    data: any;
    errors?: IApiOperationResultError[];
}

interface IApiOperationResultError
{
    id: string;
    message: string;
}

export default class ApiOperationResult implements ISerializable
{
    public data: any;
    public errors?: IApiOperationResultError[];

    constructor()
    {}

    public async serialize(): Promise<ISerializedApiOperationResult>
    {
        return {
            data: this.data,
            errors: this.errors,
        };
    }
}
export interface ISerializable
{
    serialize(): Promise<{ [ key: string ]: any }>;
}
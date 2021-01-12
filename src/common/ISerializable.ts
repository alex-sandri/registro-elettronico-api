export default interface ISerializable
{
    serialize(): Promise<{ [ key: string ]: any }>;
}
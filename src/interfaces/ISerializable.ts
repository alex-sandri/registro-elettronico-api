export default interface ISerializable
{
    serialize(): { [ key: string ]: any };
}
import { hashSync, compareSync } from "bcrypt";

export default class Utilities
{
    public static hash(data: string): string
    {
        return hashSync(data, 15);
    }

    public static verifyHash(data: string, hash: string): boolean
    {
        return compareSync(data, hash);
    }
}
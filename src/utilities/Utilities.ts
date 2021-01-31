import { hashSync, compareSync } from "bcrypt";
import cuid from "cuid";
import { Config } from "../config/Config";

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

    public static generateEmailAddress(firstName: string, lastName: string): string
    {
        let username = "";

        switch (Config.EMAIL_AUTO_GEN_MODE)
        {
            case "first.last":
            {
                username = `${firstName}.${lastName}`;

                break;
            }
            case "f.last":
            {
                username = `${firstName.charAt(0)}.${lastName}`;

                break;
            }
            case "flast":
            {
                username = `${firstName.charAt(0)}${lastName}`;

                break;
            }
        }

        return `${username}@${Config.EMAIL_DOMAIN}`.toLowerCase();
    }

    public static id(): string
    {
        return cuid();
    }
}
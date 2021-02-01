import { ISerializable } from "../common/ISerializable";
import Database from "../utilities/Database";
import User, { ISerializedUser } from "./User";
import Utilities from "../utilities/Utilities";
import { Config } from "../config/Config";

export type TSessionType = "admin" | "student"| "teacher";

interface ISession
{
    email: string;
    password: string;
}

interface ISerializedSession
{
    id: string;
    type: TSessionType;
    user: ISerializedUser;
    expires: string;
}

export default class Session implements ISerializable
{
    public readonly type = this.user.data.type;

    private constructor(
        public readonly id: string,
        public readonly user: User,
        public readonly expires: Date,
    ) {}

    public async serialize(): Promise<ISerializedSession>
    {
        return {
            id: this.id,
            type: this.user.data.type,
            user: await this.user.serialize(),
            expires: this.expires.toISOString(),
        };
    }

    public static async create(data: ISession): Promise<Session>
    {
        const user = await User.retrieve(data.email);

        if (!user)
        {
            throw new Error("This user does not exist");
        }

        if (!Utilities.verifyHash(data.password, user.data.password))
        {
            throw new Error("Wrong password");
        }

        const db = Database.client;

        const expires = new Date();
        expires.setSeconds(new Date().getSeconds() + Config.SESSION_DURATION);

        const result = await db.query(
            `insert into sessions ("user", "expires") values ($1, $2) returning "id"`,
            [ data.email, expires ],
        );

        return new Session(result.rows[0].id, user, expires);
    }

    public static async retrieve(id: string): Promise<Session | null>
    {
        const db = Database.client;

        const result = await db.query(
            "select * from sessions where id = $1",
            [ id ],
        );

        if (result.rowCount === 0)
        {
            return null;
        }

        const user = await User.retrieve(result.rows[0].user);

        if (!user)
        {
            return null;
        }

        return new Session(id, user, result.rows[0].expires);
    }

    public hasExpired(): boolean
    {
        return this.expires < new Date();
    }
}
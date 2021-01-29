import { ISerializable } from "../common/ISerializable";
import Database from "../utilities/Database";
import User, { ISerializedUser } from "./User";
import Utilities from "../utilities/Utilities";

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

        const session = await db.session.create({
            data: {
                expires,
                User: {
                    connect: {
                        email: data.email,
                    },
                },
            },
        });

        return new Session(session.id, user, expires);
    }

    public static async retrieve(id: string): Promise<Session | null>
    {
        const db = Database.client;

        const session = await db.session.findUnique({
            where: { id },
        });

        if (!session)
        {
            return null;
        }

        const user = await User.retrieve(session.user);

        if (!user)
        {
            return null;
        }

        return new Session(id, user, session.expires);
    }
}
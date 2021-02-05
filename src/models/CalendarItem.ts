import { ISerializable } from "../common/ISerializable";
import Database from "../utilities/Database";
import User, { ISerializedUser } from "./User";

interface ICreateCalendarItem
{
    type: "general" | "test" | "event" | "info" | "important";
    start: Date;
    end: Date;
    title: string;
    content: string;
    author: string;
    class: string;
}

interface ICalendarItem extends ICreateCalendarItem
{
    id: string;
}

export interface ISerializedCalendarItem
{
    id: string;
    type: "general" | "test" | "event" | "info" | "important";
    start: string;
    end: string;
    title: string;
    content: string;
    author: ISerializedUser;
}

export class CalendarItem implements ISerializable
{
    private constructor(public data: ICalendarItem)
    {}

    public async serialize(): Promise<ISerializedCalendarItem>
    {
        const user = await User.retrieve(this.data.author)

        return {
            id: this.data.id,
            type: this.data.type,
            start: this.data.start.toISOString(),
            end: this.data.end.toISOString(),
            title: this.data.title,
            content: this.data.content,
            author: await user!.serialize(),
        };
    }

    public static async create(data: ICreateCalendarItem): Promise<CalendarItem>
    {
        const result = await Database.client.query(
            "insert into calendar_items (type, start, end, title, content, author, class) values ($1, $2, $3, $4, $5, $6, $7) returning *",
            [ data.type, data.start.toISOString(), data.end.toISOString(), data.title, data.content, data.author, data.class ],
        );

        return new CalendarItem(result.rows[0]);
    }

    public static async retrieve(id: string): Promise<CalendarItem | null>
    {
        const result = await Database.client.query(
            "select * from calendar_items where id = $1",
            [ id ],
        );

        if (result.rowCount === 0)
        {
            return null;
        }

        return new CalendarItem(result.rows[0]);
    }

    public static async list(from: Date, to: Date): Promise<CalendarItem[]>
    {
        const result = await Database.client.query(
            "select * from calendar_items where start >= $1 and start <= $2",
            [ from.toISOString(), to.toISOString() ],
        );

        return result.rows.map(_ => new CalendarItem(_));
    }
}
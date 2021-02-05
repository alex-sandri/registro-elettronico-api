import { ISerializable } from "../common/ISerializable";
import Database from "../utilities/Database";
import Class, { ISerializedClass } from "./Class";
import User, { ISerializedUser } from "./User";

interface ICreateCalendarItem
{
    type: "general" | "test" | "event" | "info" | "important";
    start: Date;
    end: Date;
    title: string;
    content: string;
    class: string;
}

interface IUpdateCalendarItem
{
    type?: "general" | "test" | "event" | "info" | "important";
    start?: Date;
    end?: Date;
    title?: string;
    content?: string;
}

interface ICalendarItem extends ICreateCalendarItem
{
    id: string;
    author: string;
    created: Date;
    lastModified: Date;
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
    class: ISerializedClass;
    created: string;
    lastModified: string;
}

export class CalendarItem implements ISerializable
{
    private constructor(public data: ICalendarItem)
    {}

    public async serialize(): Promise<ISerializedCalendarItem>
    {
        const user = await User.retrieve(this.data.author);
        const itemClass = await Class.retrieve(this.data.class);

        return {
            id: this.data.id,
            type: this.data.type,
            start: this.data.start.toISOString(),
            end: this.data.end.toISOString(),
            title: this.data.title,
            content: this.data.content,
            author: await user!.serialize(),
            class: await itemClass!.serialize(),
            created: this.data.created.toISOString(),
            lastModified: this.data.lastModified.toISOString(),
        };
    }

    public static async create(data: ICreateCalendarItem, author: User): Promise<CalendarItem>
    {
        const result = await Database.client.query(
            `insert into calendar_items ("type", "start", "end", "title", "content", "author", "class") values ($1, $2, $3, $4, $5, $6, $7) returning *`,
            [ data.type, data.start.toISOString(), data.end.toISOString(), data.title, data.content, author.data.email, data.class ],
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

    public async update(data: IUpdateCalendarItem): Promise<CalendarItem>
    {
        this.data.type = data.type ?? this.data.type;
        this.data.start = data.start ?? this.data.start;
        this.data.end = data.end ?? this.data.end;
        this.data.title = data.title ?? this.data.title;
        this.data.content = data.content ?? this.data.content;

        const result = await Database.client.query(
            `update calendar_items set "type" = $1, "start" = $2, "end" = $3, "title" = $4, "content" = $5 where "id" = $6 returning "lastModified"`,
            [ this.data.type, this.data.start.toISOString(), this.data.end.toISOString(), this.data.title, this.data.content, this.data.id ],
        );

        this.data.lastModified = result.rows[0].lastModified;

        return this;
    }

    public async delete(): Promise<void>
    {
        await Database.client.query(
            "delete from calendar_items where id = $1",
            [ this.data.id ],
        );
    }

    public static async for(itemClass: Class, from: Date, to: Date): Promise<CalendarItem[]>
    {
        const result = await Database.client.query(
            "select * from calendar_items where class = $1 and start >= $2 and start <= $3",
            [ itemClass.data.name, from.toISOString(), to.toISOString() ],
        );

        return result.rows.map(_ => new CalendarItem(_));
    }
}
import { differenceInDays } from "date-fns";

import { ISerializable } from "../common/ISerializable";
import Database from "../utilities/Database";
import Student, { ISerializedStudent } from "./Student";
import User, { ISerializedUser } from "./User";

type TAbsenceType = "absence" | "late" | "short-delay" | "early-exit";

interface ICreateAbsence
{
    type: TAbsenceType;
    day: Date;
    description: string;
    student: string;
}

interface IUpdateAbsence
{
    justified?: boolean;
}

interface IDatabaseAbsence
{
    id: string;
    type: TAbsenceType;
    day: Date;
    description: string;
    justified: boolean;
    author: string;
    student: string;
    created: Date;
    lastModified: Date;
}

interface IAbsence
{
    id: string;
    type: TAbsenceType;
    from: Date;
    to: Date;
    description: string;
    justified: boolean;
    author: string;
    student: string;
    created: Date;
    lastModified: Date;
}

export interface ISerializedAbsence
{
    id: string;
    type: TAbsenceType;
    from: string;
    to: string;
    description: string;
    justified: boolean;
    author: ISerializedUser;
    student: ISerializedStudent;
    created: string;
    lastModified: string;
}

export class Absence implements ISerializable
{
    private constructor(public data: IAbsence)
    {}

    public async serialize(): Promise<ISerializedAbsence>
    {
        const author = await User.retrieve(this.data.author) as User;
        const student = await Student.retrieve(this.data.student) as Student;

        return {
            id: this.data.id,
            type: this.data.type,
            from: this.data.from.toISOString().split("T")[0],
            to: this.data.to.toISOString().split("T")[0],
            description: this.data.description,
            justified: this.data.justified,
            author: await author.serialize(),
            student: await student.serialize(),
            created: this.data.created.toISOString(),
            lastModified: this.data.lastModified.toISOString(),
        };
    }

    public static async create(data: ICreateAbsence, author: User): Promise<Absence>
    {
        const result = await Database.client.query(
            `insert into absences ("type", "day", "description", "author", "student") values ($1, $2, $3, $4, $5) returning *`,
            [ data.type, data.day.toISOString(), data.description, author.data.email, data.student ],
        );

        return new Absence(result.rows[0]);
    }

    public static async retrieve(id: string): Promise<Absence | null>
    {
        const result = await Database.client.query(
            "select * from absences where id = $1",
            [ id ],
        );

        if (result.rowCount === 0)
        {
            return null;
        }

        return new Absence(result.rows[0]);
    }

    public async update(data: IUpdateAbsence): Promise<Absence>
    {
        this.data.justified = data.justified ?? this.data.justified;

        const result = await Database.client.query(
            `update absences set "justified" = $1 where "id" = $2" returning "lastModified"`,
            [ this.data.justified, this.data.id ],
        );

        this.data.lastModified = result.rows[0].lastModified;

        return this;
    }

    public static async for(student: Student): Promise<Absence[]>
    {
        const result = await Database.client.query(
            "select * from absences where student = $1 order by day",
            [ student.data.email ],
        );

        const absences: Absence[] = [];

        result.rows.forEach((row: IDatabaseAbsence) =>
        {
            const temp = absences.find(absence =>
                differenceInDays(row.day, absence.data.to) === 1
                && row.type === "absence"
                && absence.data.justified === row.justified
            );

            if (temp)
            {
                temp.data.to = row.day;

                return;
            }

            absences.push(new Absence({
                id: row.id,
                type: row.type,
                from: row.day,
                to: row.day,
                description: row.description,
                justified: row.justified,
                author: row.author,
                student: row.student,
                created: row.created,
                lastModified: row.lastModified,
            }));
        });

        return absences;
    }
}
import { ISerializable } from "../common/ISerializable";
import Database from "../utilities/Database";
import Student, { ISerializedStudent } from "./Student";

export type TAbsenceType = "absence" | "late" | "short-delay" | "early-exit";

interface ICreateAbsence
{
    type: TAbsenceType;
    from: Date;
    to: Date;
    description: string;
    student: string;
}

interface IUpdateAbsence
{
    justified?: boolean;
}

interface IAbsence
{
    id: string;
    type: TAbsenceType;
    from: Date;
    to: Date;
    description: string;
    justified: boolean;
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
        const student = await Student.retrieve(this.data.student) as Student;

        return {
            id: this.data.id,
            type: this.data.type,
            from: this.data.from.toISOString().split("T")[0],
            to: this.data.to.toISOString().split("T")[0],
            description: this.data.description,
            justified: this.data.justified,
            student: await student.serialize(),
            created: this.data.created.toISOString(),
            lastModified: this.data.lastModified.toISOString(),
        };
    }

    public static async create(data: ICreateAbsence): Promise<Absence>
    {
        const result = await Database.client.query(
            `insert into absences ("type", "from", "to", "description", "student") values ($1, $2, $3, $4, $5) returning *`,
            [ data.type, data.from.toISOString(), data.to.toISOString(), data.description, data.student ],
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
            "select * from absences where student = $1",
            [ student.data.email ],
        );

        return result.rows.map(_ => new Absence(_));
    }
}
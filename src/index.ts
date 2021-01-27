import Api, { Endpoint, UnauthenticatedEndpoint } from "@alex-sandri/api";
import dotenv from "dotenv";

dotenv.config();

import Student from "./models/Student";
import Grade from "./models/Grade";
import Class from "./models/Class";
import Subject from "./models/Subject";
import Teacher from "./models/Teacher";
import Teaching from "./models/Teaching";
import AuthToken, { TAuthTokenType } from "./models/AuthToken";
import Admin from "./models/Admin";
import Database from "./utilities/Database";
import User from "./models/User";
import {
    AUTH_TOKEN_CREATE_SCHEMA,
    CLASS_CREATE_SCHEMA,
    GRADE_CREATE_SCHEMA,
    STUDENT_CREATE_SCHEMA,
    STUDENT_UPDATE_SCHEMA,
    SUBJECT_CREATE_SCHEMA,
    TEACHING_CREATE_SCHEMA,
} from "./config/Schemas";

Database.init();

const retrieveToken = (types: TAuthTokenType[]): (token: string) => Promise<AuthToken | null> =>
{
    return async (id: string) =>
    {
        const authToken = await AuthToken.retrieve(id);

        if (!authToken)
        {
            return null;
        }

        if (!types.includes(authToken.type))
        {
            return null;
        }

        return authToken;
    }
}

const api = new Api({
    port: 4000,
    endpoints: [
        new Endpoint<Admin, AuthToken>({
            method: "GET",
            url: "/admins",
            retrieveToken: retrieveToken([ "admin" ]),
            callback: (response, context) => Admin.list(),
        }),
        new Endpoint<Admin, AuthToken>({
            method: "GET",
            url: "/admins/:id",
            retrieveToken: retrieveToken([ "admin", "teacher" ]),
            callback: async (response, context) =>
            {
                const admin = await Admin.retrieve(context.params.id);

                if (!admin)
                {
                    return response.notFound();
                }

                return admin;
            },
        }),
        new Endpoint<Admin, AuthToken>({
            method: "POST",
            url: "/admins",
            retrieveToken: retrieveToken([ "admin" ]),
            callback: (response, context) => Admin.create(context.body),
        }),
        new Endpoint<Admin, AuthToken>({
            method: "PUT",
            url: "/admins/:id",
            retrieveToken: retrieveToken([ "admin" ]),
            callback: async (response, context) =>
            {
                const admin = await Admin.retrieve(context.params.id);

                if (!admin)
                {
                    return response.notFound();
                }

                await admin.update(context.body);

                return admin;
            },
        }),
        new Endpoint<Class, AuthToken>({
            method: "GET",
            url: "/classes",
            retrieveToken: retrieveToken([ "admin", "teacher" ]),
            callback: async (response, context) =>
            {
                let classes: Class[];

                if (context.token.type === "teacher")
                {
                    const teacher = await Teacher.retrieve(context.token.user.data.email);

                    classes = await Class.for(teacher!);
                }
                else
                {
                    classes = await Class.list();
                }

                return classes;
            },
        }),
        new Endpoint<Class, AuthToken>({
            method: "GET",
            url: "/classes/:id",
            retrieveToken: retrieveToken([ "admin", "teacher" ]),
            callback: async (response, context) =>
            {
                const retrievedClass = await Class.retrieve(context.params.id);

                if (!retrievedClass)
                {
                    return response.notFound();
                }

                return retrievedClass;
            },
        }),
        new Endpoint<Student, AuthToken>({
            method: "GET",
            url: "/classes/:id/students",
            retrieveToken: retrieveToken([ "admin", "teacher" ]),
            callback: async (response, context) =>
            {
                const retrievedClass = await Class.retrieve(context.params.id);

                if (!retrievedClass)
                {
                    return response.notFound();
                }

                return Student.for(retrievedClass);
            },
        }),
        new Endpoint<Class, AuthToken>({
            method: "POST",
            url: "/classes",
            schema: CLASS_CREATE_SCHEMA,
            retrieveToken: retrieveToken([ "admin" ]),
            callback: (response, context) => Class.create(context.body),
        }),
        new Endpoint<Grade, AuthToken>({
            method: "POST",
            url: "/grades",
            schema: GRADE_CREATE_SCHEMA,
            retrieveToken: retrieveToken([ "teacher" ]),
            callback: (response, context) => Grade.create(context.body),
        }),
        new Endpoint<Student, AuthToken>({
            method: "GET",
            url: "/students",
            retrieveToken: retrieveToken([ "admin" ]),
            callback: (response, context) => Student.list(),
        }),
        new Endpoint<Student, AuthToken>({
            method: "GET",
            url: "/students/:id",
            retrieveToken: retrieveToken([ "admin", "teacher", "student" ]),
            callback: async (response, context) =>
            {
                const student = await Student.retrieve(context.params.id);

                if (!student)
                {
                    return response.notFound();
                }

                if (context.token.type === "student" && student.data.email !== context.token.user.data.email)
                {
                    return response.forbidden();
                }

                return student;
            },
        }),
        new Endpoint<Grade, AuthToken>({
            method: "GET",
            url: "/students/:id/grades",
            retrieveToken: retrieveToken([ "admin", "teacher", "student" ]),
            callback: async (response, context) =>
            {
                const student = await Student.retrieve(context.params.id);

                if (!student)
                {
                    return response.notFound();
                }

                if (context.token.type === "student" && student.data.email !== context.token.user.data.email)
                {
                    return response.forbidden();
                }

                return Grade.for(student);
            },
        }),
        new Endpoint<Student, AuthToken>({
            method: "POST",
            url: "/students",
            schema: STUDENT_CREATE_SCHEMA,
            retrieveToken: retrieveToken([ "admin" ]),
            callback: (response, context) => Student.create(context.body),
        }),
        new Endpoint<Student, AuthToken>({
            method: "PUT",
            url: "/students/:id",
            schema: STUDENT_UPDATE_SCHEMA,
            retrieveToken: retrieveToken([ "admin", "student" ]),
            callback: async (response, context) =>
            {
                const student = await Student.retrieve(context.params.id);

                if (!student)
                {
                    return response.notFound();
                }

                if (context.token.type === "student")
                {
                    if (student.data.email !== context.token.user.data.email)
                    {
                        return response.forbidden();
                    }
                }

                await student.update(context.body);

                return student;
            },
        }),
        new Endpoint<Subject, AuthToken>({
            method: "GET",
            url: "/subjects",
            retrieveToken: retrieveToken([ "admin", "teacher", "student" ]),
            callback: (response, context) => Subject.list(),
        }),
        new Endpoint<Subject, AuthToken>({
            method: "POST",
            url: "/subjects",
            schema: SUBJECT_CREATE_SCHEMA,
            retrieveToken: retrieveToken([ "admin" ]),
            callback: (response, context) => Subject.create(context.body),
        }),
        new Endpoint<Teacher, AuthToken>({
            method: "GET",
            url: "/teachers",
            retrieveToken: retrieveToken([ "admin" ]),
            callback: (response, context) => Teacher.list(),
        }),
        new Endpoint<Teacher, AuthToken>({
            method: "GET",
            url: "/teachers/:id",
            retrieveToken: retrieveToken([ "admin", "teacher" ]),
            callback: async (response, context) =>
            {
                const teacher = await Teacher.retrieve(context.params.id);

                if (!teacher)
                {
                    return response.notFound();
                }

                return teacher;
            },
        }),
        new Endpoint<Class, AuthToken>({
            method: "GET",
            url: "/teachers/:id/classes",
            retrieveToken: retrieveToken([ "admin", "teacher" ]),
            callback: async (response, context) =>
            {
                const teacher = await Teacher.retrieve(context.params.id);

                if (!teacher)
                {
                    return response.notFound();
                }

                return Class.for(teacher);
            },
        }),
        new Endpoint<Teaching, AuthToken>({
            method: "GET",
            url: "/teachers/:id/teachings",
            retrieveToken: retrieveToken([ "admin", "teacher" ]),
            callback: async (response, context) =>
            {
                const teacher = await Teacher.retrieve(context.params.id);

                if (!teacher)
                {
                    return response.notFound();
                }

                return Teaching.for(teacher);
            },
        }),
        new Endpoint<Teacher, AuthToken>({
            method: "POST",
            url: "/teachers",
            retrieveToken: retrieveToken([ "admin" ]),
            callback: (response, context) => Teacher.create(context.body),
        }),
        new Endpoint<Teacher, AuthToken>({
            method: "PUT",
            url: "/teachers/:id",
            retrieveToken: retrieveToken([ "admin", "teacher" ]),
            callback: async (response, context) =>
            {
                const teacher = await Teacher.retrieve(context.params.id);

                if (!teacher)
                {
                    return response.notFound();
                }

                if (context.token.type === "teacher")
                {
                    if (teacher.data.email !== context.token.user.data.email)
                    {
                        return response.forbidden();
                    }
                }

                await teacher.update(context.body);

                return teacher;
            },
        }),
        new Endpoint<Teaching, AuthToken>({
            method: "POST",
            url: "/teachings",
            schema: TEACHING_CREATE_SCHEMA,
            retrieveToken: retrieveToken([ "admin" ]),
            callback: (response, context) => Teaching.create(context.body),
        }),
        new UnauthenticatedEndpoint<AuthToken>({
            method: "POST",
            url: "/tokens",
            schema: AUTH_TOKEN_CREATE_SCHEMA,
            callback: (response, context) => AuthToken.create(context.body),
        }),
        new Endpoint<User, AuthToken>({
            method: "GET",
            url: "/users",
            retrieveToken: retrieveToken([ "admin" ]),
            callback: (response, context) => User.list(),
        }),
        new Endpoint<User, AuthToken>({
            method: "GET",
            url: "/users/:id",
            retrieveToken: retrieveToken([ "admin", "teacher", "student" ]),
            callback: async (response, context) =>
            {
                const id = context.params.id;

                let user = await User.retrieve(id);

                if (!user)
                {
                    return response.notFound();
                }

                return response.redirect(`/${user.data.type}s/${id}`);
            },
        }),
    ],
});

api.listen();
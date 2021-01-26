import Api, { Endpoint, AuthenticatedEndpoint } from "@alex-sandri/api";
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
        new AuthenticatedEndpoint<Admin, AuthToken>({
            method: "GET",
            url: "/admins",
            retrieveToken: retrieveToken([ "admin" ]),
            callback: (request, response, token) => Admin.list(),
        }),
        new AuthenticatedEndpoint<Admin, AuthToken>({
            method: "GET",
            url: "/admins/:id",
            retrieveToken: retrieveToken([ "admin", "teacher" ]),
            callback: async (request, response) =>
            {
                const admin = await Admin.retrieve(request.params.id);

                if (!admin)
                {
                    response.notFound();

                    return null;
                }

                return admin;
            },
        }),
        new AuthenticatedEndpoint<Admin, AuthToken>({
            method: "POST",
            url: "/admins",
            retrieveToken: retrieveToken([ "admin" ]),
            callback: (request, response) => Admin.create(request.body),
        }),
        new AuthenticatedEndpoint<Admin, AuthToken>({
            method: "PUT",
            url: "/admins/:id",
            retrieveToken: retrieveToken([ "admin" ]),
            callback: async (request, response) =>
            {
                const admin = await Admin.retrieve(request.params.id);

                if (!admin)
                {
                    response.notFound();

                    return null;
                }

                await admin.update(request.body);

                return admin;
            },
        }),
        new AuthenticatedEndpoint<Class, AuthToken>({
            method: "GET",
            url: "/classes",
            retrieveToken: retrieveToken([ "admin", "teacher" ]),
            callback: async (request, response, token) =>
            {
                let classes: Class[];

                if (token.type === "teacher")
                {
                    const teacher = await Teacher.retrieve(token.user.data.email);

                    classes = await Class.for(teacher!);
                }
                else
                {
                    classes = await Class.list();
                }

                return classes;
            },
        }),
        new AuthenticatedEndpoint<Class, AuthToken>({
            method: "GET",
            url: "/classes/:id",
            retrieveToken: retrieveToken([ "admin", "teacher" ]),
            callback: async (request, response) =>
            {
                const retrievedClass = await Class.retrieve(request.params.id);

                if (!retrievedClass)
                {
                    response.notFound();

                    return null;
                }

                return retrievedClass;
            },
        }),
        new AuthenticatedEndpoint<Student, AuthToken>({
            method: "GET",
            url: "/classes/:id/students",
            retrieveToken: retrieveToken([ "admin", "teacher" ]),
            callback: async (request, response) =>
            {
                const retrievedClass = await Class.retrieve(request.params.id);

                if (!retrievedClass)
                {
                    response.notFound();

                    return null;
                }

                return Student.for(retrievedClass);
            },
        }),
        new AuthenticatedEndpoint<Class, AuthToken>({
            method: "POST",
            url: "/classes",
            schema: CLASS_CREATE_SCHEMA,
            retrieveToken: retrieveToken([ "admin" ]),
            callback: (request, response) => Class.create(request.body),
        }),
        new AuthenticatedEndpoint<Grade, AuthToken>({
            method: "POST",
            url: "/grades",
            schema: GRADE_CREATE_SCHEMA,
            retrieveToken: retrieveToken([ "teacher" ]),
            callback: (request, response) => Grade.create(request.body),
        }),
        new AuthenticatedEndpoint<Student, AuthToken>({
            method: "GET",
            url: "/students",
            retrieveToken: retrieveToken([ "admin" ]),
            callback: (request, response) => Student.list(),
        }),
        new AuthenticatedEndpoint<Student, AuthToken>({
            method: "GET",
            url: "/students/:id",
            retrieveToken: retrieveToken([ "admin", "teacher", "student" ]),
            callback: async (request, response, token) =>
            {
                const student = await Student.retrieve(request.params.id);

                if (!student)
                {
                    response.notFound();

                    return null;
                }

                if (token.type === "student" && student.data.email !== token.user.data.email)
                {
                    response.forbidden();

                    return null;
                }

                return student;
            },
        }),
        new AuthenticatedEndpoint<Grade, AuthToken>({
            method: "GET",
            url: "/students/:id/grades",
            retrieveToken: retrieveToken([ "admin", "teacher", "student" ]),
            callback: async (request, response, token) =>
            {
                const student = await Student.retrieve(request.params.id);

                if (!student)
                {
                    response.notFound();

                    return null;
                }

                if (token.type === "student" && student.data.email !== token.user.data.email)
                {
                    response.forbidden();

                    return null;
                }

                return Grade.for(student);
            },
        }),
        new AuthenticatedEndpoint<Student, AuthToken>({
            method: "POST",
            url: "/students",
            schema: STUDENT_CREATE_SCHEMA,
            retrieveToken: retrieveToken([ "admin" ]),
            callback: (request, response) => Student.create(request.body),
        }),
        new AuthenticatedEndpoint<Student, AuthToken>({
            method: "PUT",
            url: "/students/:id",
            schema: STUDENT_UPDATE_SCHEMA,
            retrieveToken: retrieveToken([ "admin", "student" ]),
            callback: async (request, response, token) =>
            {
                const student = await Student.retrieve(request.params.id);

                if (!student)
                {
                    response.notFound();

                    return null;
                }

                if (token.type === "student")
                {
                    if (student.data.email !== token.user.data.email)
                    {
                        response.forbidden();

                        return null;
                    }
                }

                await student.update(request.body);

                return student;
            },
        }),
        new AuthenticatedEndpoint<Subject, AuthToken>({
            method: "GET",
            url: "/subjects",
            retrieveToken: retrieveToken([ "admin", "teacher", "student" ]),
            callback: (request, response) => Subject.list(),
        }),
        new AuthenticatedEndpoint<Subject, AuthToken>({
            method: "POST",
            url: "/subjects",
            schema: SUBJECT_CREATE_SCHEMA,
            retrieveToken: retrieveToken([ "admin" ]),
            callback: (request, response) => Subject.create(request.body),
        }),
        new AuthenticatedEndpoint<Teacher, AuthToken>({
            method: "GET",
            url: "/teachers",
            retrieveToken: retrieveToken([ "admin" ]),
            callback: (request, response) => Teacher.list(),
        }),
        new AuthenticatedEndpoint<Teacher, AuthToken>({
            method: "GET",
            url: "/teachers/:id",
            retrieveToken: retrieveToken([ "admin", "teacher" ]),
            callback: async (request, response) =>
            {
                const teacher = await Teacher.retrieve(request.params.id);

                if (!teacher)
                {
                    response.notFound();

                    return null;
                }

                return teacher;
            },
        }),
        new AuthenticatedEndpoint<Teacher, AuthToken>({
            method: "POST",
            url: "/teachers",
            retrieveToken: retrieveToken([ "admin" ]),
            callback: (request, response) => Teacher.create(request.body),
        }),
        new AuthenticatedEndpoint<Teacher, AuthToken>({
            method: "PUT",
            url: "/teachers/:id",
            retrieveToken: retrieveToken([ "admin", "teacher" ]),
            callback: async (request, response, token) =>
            {
                const teacher = await Teacher.retrieve(request.params.id);

                if (!teacher)
                {
                    response.notFound();

                    return null;
                }

                if (token.type === "teacher")
                {
                    if (teacher.data.email !== token.user.data.email)
                    {
                        response.forbidden();

                        return null;
                    }
                }

                await teacher.update(request.body);

                return teacher;
            },
        }),
        new AuthenticatedEndpoint<Teaching, AuthToken>({
            method: "POST",
            url: "/teachings",
            schema: TEACHING_CREATE_SCHEMA,
            retrieveToken: retrieveToken([ "admin" ]),
            callback: (request, response) => Teaching.create(request.body),
        }),
        new Endpoint<AuthToken>({
            method: "POST",
            url: "/tokens",
            schema: AUTH_TOKEN_CREATE_SCHEMA,
            callback: (request, response) => AuthToken.create(request.body),
        }),
        new AuthenticatedEndpoint<User, AuthToken>({
            method: "GET",
            url: "/users",
            retrieveToken: retrieveToken([ "admin" ]),
            callback: (request, response) => User.list(),
        }),
        new AuthenticatedEndpoint<User, AuthToken>({
            method: "GET",
            url: "/users/:id",
            retrieveToken: retrieveToken([ "admin", "teacher", "student" ]),
            callback: async (request, response, token) =>
            {
                const id = request.params.id;

                let user = await User.retrieve(id);

                if (!user)
                {
                    response.notFound();

                    return null;
                }

                if (token.type === "student" && user.data.email !== token.user.data.email)
                {
                    response.forbidden();

                    return null;
                }

                switch (user.data.type)
                {
                    case "admin": user = await Admin.retrieve(id) as Admin; break;
                    case "student": user = await Student.retrieve(id) as Student; break;
                    case "teacher": user = await Teacher.retrieve(id) as Teacher; break;
                }

                return user;
            },
        }),
    ],
});

api.listen();
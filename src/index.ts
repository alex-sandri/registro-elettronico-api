import Hapi from "@hapi/hapi";
import Boom from "@hapi/boom";
import HapiAuthJwt from "hapi-auth-jwt2";
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
import { ISerializable } from "./common/ISerializable";

Database.init();

const serialize = async <T extends ISerializable>(data: T | T[]) =>
{
    let serialized;

    if (Array.isArray(data))
    {
        serialized = [];

        for (const element of data)
        {
            serialized.push(await element.serialize());
        }
    }
    else
    {
        serialized = await data.serialize();
    }

    return serialized;
}

const server = Hapi.server({ port: 4000 });

const init = async () =>
{
    await server.register(HapiAuthJwt);

    server.auth.strategy("jwt", "jwt", {
        key: process.env.TOKEN_SECRET,
        validate: async (decoded: { type: TAuthTokenType; user: string; }, request, h) =>
        {
            const user = await User.retrieve(decoded.user);

            if (!user)
            {
                return { isValid: false };
            }

            return {
                isValid: true,
                credentials: {
                    user,
                    scope: [ decoded.type ],
                },
            };
        }
    });

    server.auth.default({
        strategy: "jwt",
        scope: "admin",
    });

    server.route({
        method: "GET",
        path: "/admins",
        handler: async (request, h) =>
        {
            const admins = await Admin.list();

            return serialize(admins);
        },
    });

    server.route({
        method: "GET",
        path: "/admins/{id}",
        options: {
            auth: {
                scope: [ "admin", "teacher" ],
            },
        },
        handler: async (request, h) =>
        {
            const admin = await Admin.retrieve(request.params.id);

            if (!admin)
            {
                throw Boom.notFound();
            }

            return admin.serialize();
        },
    });

    server.route({
        method: "POST",
        path: "/admins",
        handler: async (request, h) =>
        {
            const admin = await Admin.create(request.payload as any);

            return admin.serialize();
        },
    });

    server.route({
        method: "PUT",
        path: "/admins/{id}",
        handler: async (request, h) =>
        {
            const admin = await Admin.retrieve(request.params.id);

            if (!admin)
            {
                throw Boom.notFound();
            }

            await admin.update(request.payload as any);

            return admin.serialize();
        },
    });

    server.route({
        method: "GET",
        path: "/classes",
        handler: async (request, h) =>
        {
            const classes = await Class.list();

            return serialize(classes);
        },
    });

    server.route({
        method: "GET",
        path: "/classes/{id}",
        options: {
            auth: {
                scope: [ "admin", "teacher" ],
            },
        },
        handler: async (request, h) =>
        {
            const retrievedClass = await Class.retrieve(request.params.id);

            if (!retrievedClass)
            {
                throw Boom.notFound();
            }

            return retrievedClass.serialize();
        },
    });

    server.route({
        method: "GET",
        path: "/classes/{id}/students",
        options: {
            auth: {
                scope: [ "admin", "teacher" ],
            },
        },
        handler: async (request, h) =>
        {
            const retrievedClass = await Class.retrieve(request.params.id);

            if (!retrievedClass)
            {
                throw Boom.notFound();
            }

            const students = await Student.for(retrievedClass);

            return serialize(students);
        },
    });

    server.route({
        method: "POST",
        path: "/classes",
        options: {
            validate: {
                payload: CLASS_CREATE_SCHEMA,
            },
        },
        handler: async (request, h) =>
        {
            const newClass = await Class.create(request.payload as any);

            return newClass.serialize();
        },
    });

    server.route({
        method: "POST",
        path: "/grades",
        options: {
            auth: {
                scope: [ "admin", "teacher" ],
            },
            validate: {
                payload: GRADE_CREATE_SCHEMA,
            },
        },
        handler: async (request, h) =>
        {
            const grade = await Grade.create(request.payload as any);

            return grade.serialize();
        },
    });

    server.route({
        method: "GET",
        path: "/students",
        handler: async (request, h) =>
        {
            const students = await Student.list();

            return serialize(students);
        },
    });

    server.route({
        method: "GET",
        path: "/students/{id}",
        options: {
            auth: {
                scope: [ "admin", "teacher", "student" ],
            },
        },
        handler: async (request, h) =>
        {
            const student = await Student.retrieve(request.params.id);

            if (!student)
            {
                throw Boom.notFound();
            }

            if (context.token.type === "student" && student.data.email !== context.token.user.data.email)
            {
                throw Boom.forbidden();
            }

            return student.serialize();
        },
    });

    server.start();
}

init();

/*
const api = new Api({
    port: 4000,
    endpoints: [
        new Endpoint<Grade, AuthToken>({
            method: "GET",
            path: "/students/{id}/grades",
            retrieveToken: retrieveToken([ "admin", "teacher", "student" ]),
            handler: async (request, h) =>
            {
                const student = await Student.retrieve(context.params.id);

                if (!student)
                {
                    throw Boom.notFound();
                }

                if (context.token.type === "student" && student.data.email !== context.token.user.data.email)
                {
                    throw Boom.forbidden();
                }

                return Grade.for(student);
            },
        }),
        new Endpoint<Student, AuthToken>({
            method: "POST",
            path: "/students",
            schema: STUDENT_CREATE_SCHEMA,
            retrieveToken: retrieveToken([ "admin" ]),
            handler: (request, h) => Student.create(context.body),
        }),
        new Endpoint<Student, AuthToken>({
            method: "PUT",
            path: "/students/{id}",
            schema: STUDENT_UPDATE_SCHEMA,
            retrieveToken: retrieveToken([ "admin", "student" ]),
            handler: async (request, h) =>
            {
                const student = await Student.retrieve(context.params.id);

                if (!student)
                {
                    throw Boom.notFound();
                }

                if (context.token.type === "student")
                {
                    if (student.data.email !== context.token.user.data.email)
                    {
                        throw Boom.forbidden();
                    }
                }

                await student.update(context.body);

                return student;
            },
        }),
        new Endpoint<Subject, AuthToken>({
            method: "GET",
            path: "/subjects",
            retrieveToken: retrieveToken([ "admin", "teacher", "student" ]),
            handler: (request, h) => Subject.list(),
        }),
        new Endpoint<Subject, AuthToken>({
            method: "POST",
            path: "/subjects",
            schema: SUBJECT_CREATE_SCHEMA,
            retrieveToken: retrieveToken([ "admin" ]),
            handler: (request, h) => Subject.create(context.body),
        }),
        new Endpoint<Teacher, AuthToken>({
            method: "GET",
            path: "/teachers",
            retrieveToken: retrieveToken([ "admin" ]),
            handler: (request, h) => Teacher.list(),
        }),
        new Endpoint<Teacher, AuthToken>({
            method: "GET",
            path: "/teachers/{id}",
            retrieveToken: retrieveToken([ "admin", "teacher" ]),
            handler: async (request, h) =>
            {
                const teacher = await Teacher.retrieve(context.params.id);

                if (!teacher)
                {
                    throw Boom.notFound();
                }

                return teacher;
            },
        }),
        new Endpoint<Class, AuthToken>({
            method: "GET",
            path: "/teachers/{id}/classes",
            retrieveToken: retrieveToken([ "admin", "teacher" ]),
            handler: async (request, h) =>
            {
                const teacher = await Teacher.retrieve(context.params.id);

                if (!teacher)
                {
                    throw Boom.notFound();
                }

                return Class.for(teacher);
            },
        }),
        new Endpoint<Teaching, AuthToken>({
            method: "GET",
            path: "/teachers/{id}/teachings",
            retrieveToken: retrieveToken([ "admin", "teacher" ]),
            handler: async (request, h) =>
            {
                const teacher = await Teacher.retrieve(context.params.id);

                if (!teacher)
                {
                    throw Boom.notFound();
                }

                return Teaching.for(teacher);
            },
        }),
        new Endpoint<Teacher, AuthToken>({
            method: "POST",
            path: "/teachers",
            retrieveToken: retrieveToken([ "admin" ]),
            handler: (request, h) => Teacher.create(context.body),
        }),
        new Endpoint<Teacher, AuthToken>({
            method: "PUT",
            path: "/teachers/{id}",
            retrieveToken: retrieveToken([ "admin", "teacher" ]),
            handler: async (request, h) =>
            {
                const teacher = await Teacher.retrieve(context.params.id);

                if (!teacher)
                {
                    throw Boom.notFound();
                }

                if (context.token.type === "teacher")
                {
                    if (teacher.data.email !== context.token.user.data.email)
                    {
                        throw Boom.forbidden();
                    }
                }

                await teacher.update(context.body);

                return teacher;
            },
        }),
        new Endpoint<Teaching, AuthToken>({
            method: "POST",
            path: "/teachings",
            schema: TEACHING_CREATE_SCHEMA,
            retrieveToken: retrieveToken([ "admin" ]),
            handler: (request, h) => Teaching.create(context.body),
        }),
        new UnauthenticatedEndpoint<AuthToken>({
            method: "POST",
            path: "/tokens",
            schema: AUTH_TOKEN_CREATE_SCHEMA,
            handler: (request, h) => AuthToken.create(context.body),
        }),
        new Endpoint<User, AuthToken>({
            method: "GET",
            path: "/users",
            retrieveToken: retrieveToken([ "admin" ]),
            handler: (request, h) => User.list(),
        }),
        new Endpoint<User, AuthToken>({
            method: "GET",
            path: "/users/{id}",
            retrieveToken: retrieveToken([ "admin", "teacher", "student" ]),
            handler: async (request, h) =>
            {
                const id = context.params.id;

                let user = await User.retrieve(id);

                if (!user)
                {
                    throw Boom.notFound();
                }

                return response.redirect(`/${user.data.type}s/${id}`);
            },
        }),
    ],
});*/
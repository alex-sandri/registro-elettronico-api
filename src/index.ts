import Hapi from "@hapi/hapi";
import Boom from "@hapi/boom";
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

const server = Hapi.server({ port: 4000 });

// TODO: Add auth

server.route({
    // admin
    method: "GET",
    path: "/admins",
    handler: async (request, h) =>
    {
        const admins = await Admin.list();

        return h.response(await serialize(admins));
    },
});

server.route({
    // admin, teacher
    method: "GET",
    path: "/admins/{id}",
    handler: async (request, h) =>
    {
        const admin = await Admin.retrieve(request.params.id);

        if (!admin)
        {
            throw Boom.notFound();
        }

        return admin;
    },
});

server.route({
    // admin
    method: "POST",
    path: "/admins",
    handler: async (request, h) =>
    {
        const admin = await Admin.create(request.payload as any);

        return h.response(await admin.serialize());
    },
});

server.route({
    // admin
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

        return h.response(await admin.serialize());
    },
});
/*
server.route({
    // admin, teacher
    method: "GET",
    path: "/classes",
    handler: async (request, h) =>
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

        return h.response(await serialize(classes));
    },
});
*/
server.route({
    // admin, teacher
    method: "GET",
    path: "/classes/{id}",
    handler: async (request, h) =>
    {
        const retrievedClass = await Class.retrieve(request.params.id);

        if (!retrievedClass)
        {
            throw Boom.notFound();
        }

        return h.response(await retrievedClass.serialize());
    },
});

server.route({
    // admin, teacher
    method: "GET",
    path: "/classes/{id}/students",
    handler: async (request, h) =>
    {
        const retrievedClass = await Class.retrieve(request.params.id);

        if (!retrievedClass)
        {
            throw Boom.notFound();
        }

        const students = await Student.for(retrievedClass);

        return h.response(await serialize(students));
    },
});

server.route({
    // admin
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

        return h.response(await newClass.serialize());
    },
});

server.route({
    // teacher
    method: "POST",
    path: "/grades",
    options: {
        validate: {
            payload: GRADE_CREATE_SCHEMA,
        },
    },
    handler: async (request, h) =>
    {
        const grade = await Grade.create(request.payload as any);

        return h.response(await grade.serialize());
    },
});

server.route({
    // admin
    method: "GET",
    path: "/students",
    handler: async (request, h) =>
    {
        const students = await Student.list();

        return h.response(await serialize(students));
    },
});
/*
server.route({
    // admin, teacher, student
    method: "GET",
    path: "/students/{id}",
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

        return student;
    },
});
*/
server.start();

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
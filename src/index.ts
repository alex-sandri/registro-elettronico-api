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
            /*
            TODO
            if (context.token.type === "student" && student.data.email !== context.token.user.data.email)
            {
                throw Boom.forbidden();
            }*/

            return student.serialize();
        },
    });

    server.route({
        method: "GET",
        path: "/students/{id}/grades",
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
            /*
            TODO
            if (context.token.type === "student" && student.data.email !== context.token.user.data.email)
            {
                throw Boom.forbidden();
            }
            */

            const grades = await Grade.for(student);

            return serialize(grades);
        },
    });

    server.route({
        method: "POST",
        path: "/students",
        options: {
            validate: {
                payload: STUDENT_CREATE_SCHEMA,
            },
        },
        handler: async (request, h) =>
        {
            const student = await Student.create(request.payload as any);

            return student.serialize();
        },
    });

    server.route({
        method: "PUT",
        path: "/students/{id}",
        options: {
            auth: {
                scope: [ "admin", "student" ],
            },
            validate: {
                payload: STUDENT_UPDATE_SCHEMA,
            },
        },
        handler: async (request, h) =>
        {
            const student = await Student.retrieve(request.params.id);

            if (!student)
            {
                throw Boom.notFound();
            }
            /*
            TODO
            if (context.token.type === "student")
            {
                if (student.data.email !== context.token.user.data.email)
                {
                    throw Boom.forbidden();
                }
            }
            */

            await student.update(request.payload as any);

            return student.serialize();
        },
    });

    server.route({
        method: "GET",
        path: "/subjects",
        options: {
            auth: {
                scope: [ "admin", "teacher", "student" ],
            },
        },
        handler: async (request, h) =>
        {
            const subjects = await Subject.list();

            return serialize(subjects);
        },
    });

    server.route({
        method: "POST",
        path: "/subjects",
        options: {
            validate: {
                payload: SUBJECT_CREATE_SCHEMA,
            },
        },
        handler: async (request, h) =>
        {
            const subject = await Subject.create(request.payload as any);

            return subject.serialize();
        },
    });

    server.route({
        method: "GET",
        path: "/teachers",
        handler: async (request, h) =>
        {
            const teachers = await Teacher.list();

            return serialize(teachers);
        },
    });

    server.route({
        method: "GET",
        path: "/teachers/{id}",
        options: {
            auth: {
                scope: [ "admin", "teacher" ],
            },
        },
        handler: async (request, h) =>
        {
            const teacher = await Teacher.retrieve(request.params.id);

            if (!teacher)
            {
                throw Boom.notFound();
            }

            return teacher.serialize();
        },
    });

    server.route({
        method: "GET",
        path: "/teachers/{id}/classes",
        options: {
            auth: {
                scope: [ "admin", "teacher" ],
            },
        },
        handler: async (request, h) =>
        {
            const teacher = await Teacher.retrieve(request.params.id);

            if (!teacher)
            {
                throw Boom.notFound();
            }

            const classes = await Class.for(teacher);

            return Promise.all(classes.map(_ => _.serialize()));
        },
    });

    server.route({
        method: "GET",
        path: "/teachers/{id}/teachings",
        options: {
            auth: {
                scope: [ "admin", "teacher" ],
            },
        },
        handler: async (request, h) =>
        {
            const teacher = await Teacher.retrieve(request.params.id);

            if (!teacher)
            {
                throw Boom.notFound();
            }

            const teachings = await Teaching.for(teacher);

            return Promise.all(teachings.map(_ => _.serialize()));
        },
    });

    server.route({
        method: "POST",
        path: "/teachers",
        handler: async (request, h) =>
        {
            const teacher = await Teacher.create(request.payload as any);

            return teacher.serialize();
        },
    });

    server.route({
        method: "PUT",
        path: "/teachers/{id}",
        options: {
            auth: {
                scope: [ "admin", "teacher" ],
            },
        },
        handler: async (request, h) =>
        {
            const teacher = await Teacher.retrieve(request.params.id);

            if (!teacher)
            {
                throw Boom.notFound();
            }

            /*
            TODO
            if (context.token.type === "teacher")
            {
                if (teacher.data.email !== context.token.user.data.email)
                {
                    throw Boom.forbidden();
                }
            }
            */

            await teacher.update(request.payload as any);

            return teacher.serialize();
        },
    });

    server.route({
        method: "POST",
        path: "/teachings",
        options: {
            validate: {
                payload: TEACHING_CREATE_SCHEMA,
            },
        },
        handler: async (request, h) =>
        {
            const teaching = await Teaching.create(request.payload as any);

            return teaching.serialize();
        },
    });

    server.route({
        method: "POST",
        path: "/tokens",
        options: {
            auth: false,
            validate: {
                payload: AUTH_TOKEN_CREATE_SCHEMA,
            },
        },
        handler: async (request, h) =>
        {
            const token = await AuthToken.create(request.payload as any);

            return token.serialize();
        },
    });

    server.route({
        method: "GET",
        path: "/users",
        handler: async (request, h) =>
        {
            const users = await User.list();

            return Promise.all(users.map(_ => _.serialize()));
        },
    });

    server.route({
        method: "GET",
        path: "/users/{id}",
        options: {
            auth: {
                scope: [ "admin", "teacher", "student" ],
            },
        },
        handler: async (request, h) =>
        {
            const id = request.params.id;

            let user = await User.retrieve(id);

            if (!user)
            {
                throw Boom.notFound();
            }

            return h.redirect(`/${user.data.type}s/${id}`);
        },
    });


    server.start();
}

init();
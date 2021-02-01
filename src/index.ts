import Hapi from "@hapi/hapi";
import Boom from "@hapi/boom";
import Inert from "@hapi/inert";
import Vision from "@hapi/vision";
import HapiSwagger from "hapi-swagger";
import Joi from "joi";
import dotenv from "dotenv";

dotenv.config();

import Student from "./models/Student";
import Grade from "./models/Grade";
import Class from "./models/Class";
import Subject from "./models/Subject";
import Teacher from "./models/Teacher";
import Teaching from "./models/Teaching";
import Session from "./models/Session";
import Admin from "./models/Admin";
import Database from "./utilities/Database";
import User from "./models/User";
import {
    ADMIN_CREATE_SCHEMA,
    ADMIN_SCHEMA,
    ADMIN_UPDATE_SCHEMA,
    CLASS_CREATE_SCHEMA,
    CLASS_SCHEMA,
    GRADE_CREATE_SCHEMA,
    SESSION_CREATE_SCHEMA,
    STUDENT_CREATE_SCHEMA,
    STUDENT_SCHEMA,
    STUDENT_UPDATE_SCHEMA,
    SUBJECT_CREATE_SCHEMA,
    TEACHER_CREATE_SCHEMA,
    TEACHER_SCHEMA,
    TEACHER_UPDATE_SCHEMA,
    TEACHING_CREATE_SCHEMA,
    USER_SCHEMA,
} from "./config/Schemas";
import {
    GET_ADMIN_HANDLER,
    GET_STUDENT_HANDLER,
    GET_TEACHER_HANDLER
} from "./config/Handlers";

const pkg = require('../package.json');

const server = Hapi.server({
    port: 4000,
    routes: {
        cors: true,
        validate: {
            options: {
                abortEarly: false,
            },
            failAction: async (request, h, error) =>
            {
                throw error;
            },
        },
    },
});

const init = async () =>
{
    await Database.init();

    await server.register([
        { plugin: Inert },
        { plugin: Vision },
        {
            plugin: HapiSwagger,
            options: {
                info: {
                    title: "Registro Elettronico API",
                    version: pkg.version,
                },
                documentationPath: "/docs",
            },
        },
    ]);

    server.auth.scheme("token", (server, options) =>
    {
        return {
            authenticate: async (request, h) =>
            {
                const authorization = request.raw.req.headers.authorization;

                if (!authorization)
                {
                    throw Boom.unauthorized();
                }

                const session = await Session.retrieve(authorization.split(" ")[1]);

                if (!session || session.hasExpired())
                {
                    throw Boom.unauthorized();
                }

                const { user } = session;

                return h.authenticated({
                    credentials: {
                        user,
                        scope: [ user.data.type ],
                    },
                });
            },
        };
    });

    server.auth.strategy("session", "token");

    server.auth.default({
        strategy: "session",
        scope: "admin",
    });

    server.ext("onPreResponse", (request, h) =>
    {
        const { response } = request;

        if (response instanceof Boom.Boom)
        {
            response.output.payload.message = response.message;
        }

        return h.continue;
    });

    server.route({
        method: "GET",
        path: "/admins",
        options: {
            tags: [ "api" ],
            response: {
                schema: Joi.array().items(ADMIN_SCHEMA).required().label("Admins"),
            },
        },
        handler: async (request, h) =>
        {
            const admins = await Admin.list();

            return Promise.all(admins.map(_ => _.serialize()));
        },
    });

    server.route({
        method: "GET",
        path: "/admins/{id}",
        options: {
            tags: [ "api" ],
            auth: {
                scope: [ "admin", "teacher" ],
            },
            response: {
                schema: ADMIN_SCHEMA,
            },
        },
        handler: GET_ADMIN_HANDLER,
    });

    server.route({
        method: "POST",
        path: "/admins",
        options: {
            tags: [ "api" ],
            validate: {
                payload: ADMIN_CREATE_SCHEMA,
            },
            response: {
                schema: ADMIN_SCHEMA,
            },
        },
        handler: async (request, h) =>
        {
            const admin = await Admin.create(request.payload as any);

            return admin.serialize();
        },
    });

    server.route({
        method: "PUT",
        path: "/admins/{id}",
        options: {
            tags: [ "api" ],
            validate: {
                payload: ADMIN_UPDATE_SCHEMA,
            },
            response: {
                schema: ADMIN_SCHEMA,
            },
        },
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
        options: {
            tags: [ "api" ],
            response: {
                schema: Joi.array().items(CLASS_SCHEMA).required().label("Classes"),
            },
        },
        handler: async (request, h) =>
        {
            const classes = await Class.list();

            return Promise.all(classes.map(_ => _.serialize()));
        },
    });

    server.route({
        method: "GET",
        path: "/classes/{id}",
        options: {
            tags: [ "api" ],
            auth: {
                scope: [ "admin", "teacher" ],
            },
            response: {
                schema: CLASS_SCHEMA,
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
            tags: [ "api" ],
            auth: {
                scope: [ "admin", "teacher" ],
            },
            response: {
                schema: Joi.array().items(STUDENT_SCHEMA).required().label("Students"),
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

            return Promise.all(students.map(_ => _.serialize()));
        },
    });

    server.route({
        method: "POST",
        path: "/classes",
        options: {
            tags: [ "api" ],
            validate: {
                payload: CLASS_CREATE_SCHEMA,
            },
            response: {
                schema: CLASS_SCHEMA,
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
            tags: [ "api" ],
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
        method: "POST",
        path: "/sessions",
        options: {
            tags: [ "api" ],
            auth: false,
            validate: {
                payload: SESSION_CREATE_SCHEMA,
            },
        },
        handler: async (request, h) =>
        {
            const session = await Session.create(request.payload as any);

            return session.serialize();
        },
    });

    server.route({
        method: "GET",
        path: "/students",
        options: {
            tags: [ "api" ],
            response: {
                schema: Joi.array().items(STUDENT_SCHEMA).required().label("Students"),
            },
        },
        handler: async (request, h) =>
        {
            const students = await Student.list();

            return Promise.all(students.map(_ => _.serialize()));
        },
    });

    server.route({
        method: "GET",
        path: "/students/{id}",
        options: {
            tags: [ "api" ],
            auth: {
                scope: [ "admin", "teacher", "student" ],
            },
            response: {
                schema: STUDENT_SCHEMA,
            },
        },
        handler: GET_STUDENT_HANDLER,
    });

    server.route({
        method: "GET",
        path: "/students/{id}/grades",
        options: {
            tags: [ "api" ],
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

            const user = request.auth.credentials.user as User;

            if (user.data.type === "student" && student.data.email !== user.data.email)
            {
                throw Boom.forbidden();
            }

            const grades = await Grade.for(student);

            return Promise.all(grades.map(_ => _.serialize()));
        },
    });

    server.route({
        method: "POST",
        path: "/students",
        options: {
            tags: [ "api" ],
            validate: {
                payload: STUDENT_CREATE_SCHEMA,
            },
            response: {
                schema: STUDENT_SCHEMA,
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
            tags: [ "api" ],
            auth: {
                scope: [ "admin", "student" ],
            },
            validate: {
                payload: STUDENT_UPDATE_SCHEMA,
            },
            response: {
                schema: STUDENT_SCHEMA,
            },
        },
        handler: async (request, h) =>
        {
            const student = await Student.retrieve(request.params.id);

            if (!student)
            {
                throw Boom.notFound();
            }

            const user = request.auth.credentials.user as User;

            if (user.data.type === "student" && student.data.email !== user.data.email)
            {
                throw Boom.forbidden();
            }

            await student.update(request.payload as any);

            return student.serialize();
        },
    });

    server.route({
        method: "GET",
        path: "/subjects",
        options: {
            tags: [ "api" ],
            auth: {
                scope: [ "admin", "teacher", "student" ],
            },
        },
        handler: async (request, h) =>
        {
            const subjects = await Subject.list();

            return Promise.all(subjects.map(_ => _.serialize()));
        },
    });

    server.route({
        method: "POST",
        path: "/subjects",
        options: {
            tags: [ "api" ],
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
        options: {
            tags: [ "api" ],
            response: {
                schema: Joi.array().items(TEACHER_SCHEMA).required().label("Teachers"),
            },
        },
        handler: async (request, h) =>
        {
            const teachers = await Teacher.list();

            return Promise.all(teachers.map(_ => _.serialize()));
        },
    });

    server.route({
        method: "GET",
        path: "/teachers/{id}",
        options: {
            tags: [ "api" ],
            auth: {
                scope: [ "admin", "teacher" ],
            },
            response: {
                schema: TEACHER_SCHEMA,
            },
        },
        handler: GET_TEACHER_HANDLER,
    });

    server.route({
        method: "GET",
        path: "/teachers/{id}/classes",
        options: {
            tags: [ "api" ],
            auth: {
                scope: [ "admin", "teacher" ],
            },
            response: {
                schema: Joi.array().items(CLASS_SCHEMA).required().label("Classes"),
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
            tags: [ "api" ],
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
        options: {
            tags: [ "api" ],
            validate: {
                payload: TEACHER_CREATE_SCHEMA,
            },
            response: {
                schema: TEACHER_SCHEMA,
            },
        },
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
            tags: [ "api" ],
            auth: {
                scope: [ "admin", "teacher" ],
            },
            validate: {
                payload: TEACHER_UPDATE_SCHEMA,
            },
            response: {
                schema: TEACHER_SCHEMA,
            },
        },
        handler: async (request, h) =>
        {
            const teacher = await Teacher.retrieve(request.params.id);

            if (!teacher)
            {
                throw Boom.notFound();
            }

            const user = request.auth.credentials.user as User;

            if (user.data.type === "teacher" && teacher.data.email !== user.data.email)
            {
                throw Boom.forbidden();
            }

            await teacher.update(request.payload as any);

            return teacher.serialize();
        },
    });

    server.route({
        method: "POST",
        path: "/teachings",
        options: {
            tags: [ "api" ],
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
        method: "GET",
        path: "/users",
        options: {
            tags: [ "api" ],
            response: {
                schema: Joi.array().items(USER_SCHEMA).required().label("Users"),
            },
        },
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
            tags: [ "api" ],
            auth: {
                scope: [ "admin", "teacher", "student" ],
            },
            validate: {
                params: Joi.object({
                    id: Joi.string().required(),
                }),
            },
            response: {
                schema: Joi.alternatives().try(ADMIN_SCHEMA, STUDENT_SCHEMA, TEACHER_SCHEMA).required().label("User"),
            },
        },
        handler: async (request, h) =>
        {
            const id = request.params.id;

            const user = await User.retrieve(id);

            if (!user)
            {
                throw Boom.notFound();
            }

            switch (user.data.type)
            {
                case "admin": return GET_ADMIN_HANDLER(request, h);
                case "student": return GET_STUDENT_HANDLER(request, h);
                case "teacher": return GET_TEACHER_HANDLER(request, h);
            }
        },
    });

    server.route({
        method: "DELETE",
        path: "/users/{id}",
        options: {
            tags: [ "api" ],
            auth: {
                scope: [ "admin" ],
            },
            validate: {
                params: Joi.object({
                    id: Joi.string().required(),
                }),
            },
            response: {
                emptyStatusCode: 204,
            },
        },
        handler: async (request, h) =>
        {
            const id = request.params.id;

            const user = await User.retrieve(id);

            if (!user)
            {
                throw Boom.notFound();
            }

            await user.delete();

            return h.response();
        },
    });

    server.start();
}

init();
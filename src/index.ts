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
    ABSENCE_CREATE_SCHEMA,
    ABSENCE_SCHEMA,
    ABSENCE_UPDATE_SCHEMA,
    ADMIN_CREATE_SCHEMA,
    ADMIN_SCHEMA,
    ADMIN_UPDATE_SCHEMA,
    CALENDAR_ITEM_CREATE_SCHEMA,
    CALENDAR_ITEM_SCHEMA,
    CALENDAR_ITEM_UPDATE_SCHEMA,
    CLASS_CREATE_SCHEMA,
    CLASS_SCHEMA,
    DATETIME_SCHEMA,
    DATE_SCHEMA,
    DEMERIT_CREATE_SCHEMA,
    DEMERIT_SCHEMA,
    EMAIL_SCHEMA,
    GRADE_CREATE_SCHEMA,
    GRADE_SCHEMA,
    LESSON_CREATE_SCHEMA,
    LESSON_SCHEMA,
    LESSON_UPDATE_SCHEMA,
    SESSION_CREATE_SCHEMA,
    SESSION_SCHEMA,
    STUDENT_CREATE_SCHEMA,
    STUDENT_REPORT_SCHEMA,
    STUDENT_SCHEMA,
    STUDENT_UPDATE_SCHEMA,
    SUBJECT_CREATE_SCHEMA,
    SUBJECT_SCHEMA,
    SUBJECT_UPDATE_SCHEMA,
    TEACHER_CREATE_SCHEMA,
    TEACHER_SCHEMA,
    TEACHER_UPDATE_SCHEMA,
    TEACHING_CREATE_SCHEMA,
    TEACHING_SCHEMA,
    USER_SCHEMA,
    UUID_SCHEMA,
} from "./config/Schemas";
import {
    GET_ADMIN_HANDLER,
    GET_STUDENT_HANDLER,
    GET_TEACHER_HANDLER
} from "./config/Handlers";
import { CalendarItem } from "./models/CalendarItem";
import { Demerit } from "./models/Demerit";
import { Lesson } from "./models/Lesson";
import { Absence } from "./models/Absence";

const pkg = require("../package.json");

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
        response: {
            emptyStatusCode: 204,
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
        path: "/absences/{id}",
        options: {
            tags: [ "api" ],
            auth: {
                scope: [ "admin", "teacher", "student" ],
            },
            validate: {
                params: Joi.object({
                    id: UUID_SCHEMA.required(),
                }),
            },
            response: {
                schema: ABSENCE_SCHEMA,
            },
        },
        handler: async (request, h) =>
        {
            const absence = await Absence.retrieve(request.params.id);

            if (!absence)
            {
                throw Boom.notFound();
            }

            const user = request.auth.credentials.user as User;

            switch (user.data.type)
            {
                case "student":
                {
                    const student = await Student.retrieve(user.data.email) as Student;

                    if (student.data.email !== absence.data.student)
                    {
                        throw Boom.forbidden();
                    }

                    break;
                }
                case "teacher":
                {
                    const teacher = await Teacher.retrieve(user.data.email) as Teacher;
                    const student = await Student.retrieve(absence.data.student) as Student;

                    if (!(await teacher.teachesIn(student.data.class)))
                    {
                        throw Boom.forbidden();
                    }

                    break;
                }
            }

            return absence.serialize();
        },
    });

    server.route({
        method: "POST",
        path: "/absences",
        options: {
            tags: [ "api" ],
            auth: {
                scope: [ "teacher" ],
            },
            validate: {
                payload: ABSENCE_CREATE_SCHEMA,
            },
            response: {
                schema: ABSENCE_SCHEMA,
            },
        },
        handler: async (request, h) =>
        {
            const absence = await Absence.create(request.payload as any);

            return absence.serialize();
        },
    });

    server.route({
        method: "PUT",
        path: "/absences/{id}",
        options: {
            tags: [ "api" ],
            auth: {
                scope: [ "admin", "teacher" ],
            },
            validate: {
                params: Joi.object({
                    id: UUID_SCHEMA.required(),
                }),
                payload: ABSENCE_UPDATE_SCHEMA,
            },
            response: {
                schema: ABSENCE_SCHEMA,
            },
        },
        handler: async (request, h) =>
        {
            const absence = await Absence.retrieve(request.params.id);

            if (!absence)
            {
                throw Boom.notFound();
            }

            const user = request.auth.credentials.user as User;

            if (user.data.type === "teacher")
            {
                const teacher = await Teacher.retrieve(user.data.email) as Teacher;
                const student = await Student.retrieve(absence.data.student) as Student;

                if (!(await teacher.teachesIn(student.data.class)))
                {
                    throw Boom.forbidden();
                }
            }

            await absence.update(request.payload as any);

            return absence.serialize();
        },
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
            validate: {
                params: Joi.object({
                    id: EMAIL_SCHEMA.required(),
                }),
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
                params: Joi.object({
                    id: EMAIL_SCHEMA.required(),
                }),
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
        path: "/calendar/{id}",
        options: {
            tags: [ "api" ],
            auth: {
                scope: [ "admin", "teacher", "student" ],
            },
            validate: {
                params: Joi.object({
                    id: UUID_SCHEMA.required(),
                }),
            },
            response: {
                schema: CALENDAR_ITEM_SCHEMA,
            },
        },
        handler: async (request, h) =>
        {
            const item = await CalendarItem.retrieve(request.params.id);

            if (!item)
            {
                throw Boom.notFound();
            }

            const user = request.auth.credentials.user as User;

            switch (user.data.type)
            {
                case "student":
                {
                    const student = await Student.retrieve(user.data.email) as Student;

                    if (student.data.class !== item.data.class)
                    {
                        throw Boom.forbidden();
                    }

                    break;
                }
                case "teacher":
                {
                    const teacher = await Teacher.retrieve(user.data.email) as Teacher;

                    if (!(await teacher.teachesIn(item.data.class)))
                    {
                        throw Boom.forbidden();
                    }

                    break;
                }
            }

            return item.serialize();
        },
    });

    server.route({
        method: "POST",
        path: "/calendar",
        options: {
            tags: [ "api" ],
            auth: {
                scope: [ "admin", "teacher" ],
            },
            validate: {
                payload: CALENDAR_ITEM_CREATE_SCHEMA,
            },
            response: {
                schema: CALENDAR_ITEM_SCHEMA,
            },
        },
        handler: async (request, h) =>
        {
            const author = request.auth.credentials.user as User;

            const item = await CalendarItem.create(request.payload as any, author);

            return item.serialize();
        },
    });

    server.route({
        method: "PUT",
        path: "/calendar/{id}",
        options: {
            tags: [ "api" ],
            auth: {
                scope: [ "admin", "teacher" ],
            },
            validate: {
                params: Joi.object({
                    id: UUID_SCHEMA.required(),
                }),
                payload: CALENDAR_ITEM_UPDATE_SCHEMA,
            },
            response: {
                schema: CALENDAR_ITEM_SCHEMA,
            },
        },
        handler: async (request, h) =>
        {
            const item = await CalendarItem.retrieve(request.params.id);

            if (!item)
            {
                throw Boom.notFound();
            }

            const user = request.auth.credentials.user as User;

            if (user.data.email !== item.data.author)
            {
                throw Boom.forbidden();
            }

            await item.update(request.payload as any);

            return item.serialize();
        },
    });

    server.route({
        method: "DELETE",
        path: "/calendar/{id}",
        options: {
            tags: [ "api" ],
            auth: {
                scope: [ "admin", "teacher" ],
            },
            validate: {
                params: Joi.object({
                    id: UUID_SCHEMA.required(),
                }),
            },
        },
        handler: async (request, h) =>
        {
            const item = await CalendarItem.retrieve(request.params.id);

            if (!item)
            {
                throw Boom.notFound();
            }

            const user = request.auth.credentials.user as User;

            if (user.data.email !== item.data.author)
            {
                throw Boom.forbidden();
            }

            await item.delete();

            return h.response();
        },
    });

    server.route({
        method: "GET",
        path: "/lessons/{id}",
        options: {
            tags: [ "api" ],
            auth: {
                scope: [ "admin", "teacher", "student" ],
            },
            validate: {
                params: Joi.object({
                    id: UUID_SCHEMA.required(),
                }),
            },
            response: {
                schema: LESSON_SCHEMA,
            },
        },
        handler: async (request, h) =>
        {
            const lesson = await Lesson.retrieve(request.params.id);

            if (!lesson)
            {
                throw Boom.notFound();
            }

            const user = request.auth.credentials.user as User;

            switch (user.data.type)
            {
                case "student":
                {
                    const student = await Student.retrieve(user.data.email) as Student;

                    if (student.data.class !== lesson.data.class)
                    {
                        throw Boom.forbidden();
                    }

                    break;
                }
                case "teacher":
                {
                    const teacher = await Teacher.retrieve(user.data.email) as Teacher;

                    if (!(await teacher.teachesIn(lesson.data.class)))
                    {
                        throw Boom.forbidden();
                    }

                    break;
                }
            }

            return lesson.serialize();
        },
    });

    server.route({
        method: "POST",
        path: "/lessons",
        options: {
            tags: [ "api" ],
            auth: {
                scope: [ "teacher" ],
            },
            validate: {
                payload: LESSON_CREATE_SCHEMA,
            },
            response: {
                schema: LESSON_SCHEMA,
            },
        },
        handler: async (request, h) =>
        {
            const teacher = request.auth.credentials.user as User;

            const lesson = await Lesson.create(request.payload as any, teacher);

            return lesson.serialize();
        },
    });

    server.route({
        method: "PUT",
        path: "/lessons/{id}",
        options: {
            tags: [ "api" ],
            auth: {
                scope: [ "admin", "teacher" ],
            },
            validate: {
                params: Joi.object({
                    id: UUID_SCHEMA.required(),
                }),
                payload: LESSON_UPDATE_SCHEMA,
            },
            response: {
                schema: LESSON_SCHEMA,
            },
        },
        handler: async (request, h) =>
        {
            const lesson = await Lesson.retrieve(request.params.id);

            if (!lesson)
            {
                throw Boom.notFound();
            }

            const user = request.auth.credentials.user as User;

            if (user.data.type === "teacher" && user.data.email !== lesson.data.teacher)
            {
                throw Boom.forbidden();
            }

            await lesson.update(request.payload as any);

            return lesson.serialize();
        },
    });

    server.route({
        method: "DELETE",
        path: "/lessons/{id}",
        options: {
            tags: [ "api" ],
            auth: {
                scope: [ "admin", "teacher" ],
            },
            validate: {
                params: Joi.object({
                    id: UUID_SCHEMA.required(),
                }),
            },
        },
        handler: async (request, h) =>
        {
            const lesson = await Lesson.retrieve(request.params.id);

            if (!lesson)
            {
                throw Boom.notFound();
            }

            const user = request.auth.credentials.user as User;

            if (user.data.type === "teacher" && user.data.email !== lesson.data.teacher)
            {
                throw Boom.forbidden();
            }

            await lesson.delete();

            return h.response();
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
        path: "/classes/{id}/calendar",
        options: {
            tags: [ "api" ],
            auth: {
                scope: [ "admin", "teacher", "student" ],
            },
            validate: {
                query: Joi.object({
                    from: DATETIME_SCHEMA.required(),
                    to: DATETIME_SCHEMA.greater(Joi.ref("from")).required(),
                }),
            },
            response: {
                schema: Joi.array().items(CALENDAR_ITEM_SCHEMA).required().label("Calendar Items"),
            },
        },
        handler: async (request, h) =>
        {
            const retrievedClass = await Class.retrieve(request.params.id);

            if (!retrievedClass)
            {
                throw Boom.notFound();
            }

            const user = request.auth.credentials.user as User;

            switch (user.data.type)
            {
                case "student":
                {
                    const student = await Student.retrieve(user.data.email) as Student;

                    if (student.data.class !== retrievedClass.data.name)
                    {
                        throw Boom.forbidden();
                    }

                    break;
                }
                case "teacher":
                {
                    const teacher = await Teacher.retrieve(user.data.email) as Teacher;

                    if (!(await teacher.teachesIn(retrievedClass.data.name)))
                    {
                        throw Boom.forbidden();
                    }

                    break;
                }
            }

            const items = await CalendarItem.for(retrievedClass, request.query.from, request.query.to);

            return Promise.all(items.map(_ => _.serialize()));
        },
    });

    server.route({
        method: "GET",
        path: "/classes/{id}/lessons",
        options: {
            tags: [ "api" ],
            auth: {
                scope: [ "admin", "teacher", "student" ],
            },
            validate: {
                query: Joi.object({
                    from: DATE_SCHEMA,
                    to: DATE_SCHEMA.min(Joi.ref("from")),
                }),
            },
            response: {
                schema: Joi.array().items(LESSON_SCHEMA).required().label("Lessons"),
            },
        },
        handler: async (request, h) =>
        {
            const retrievedClass = await Class.retrieve(request.params.id);

            if (!retrievedClass)
            {
                throw Boom.notFound();
            }

            const user = request.auth.credentials.user as User;

            switch (user.data.type)
            {
                case "student":
                {
                    const student = await Student.retrieve(user.data.email) as Student;

                    if (student.data.class !== retrievedClass.data.name)
                    {
                        throw Boom.forbidden();
                    }

                    break;
                }
                case "teacher":
                {
                    const teacher = await Teacher.retrieve(user.data.email) as Teacher;

                    if (!await teacher.teachesIn(retrievedClass.data.name))
                    {
                        throw Boom.forbidden();
                    }

                    break;
                }
            }

            const lessons = await Lesson.for(retrievedClass, request.query.from, request.query.to);

            return Promise.all(lessons.map(_ => _.serialize()));
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
        method: "GET",
        path: "/demerits/{id}",
        options: {
            tags: [ "api" ],
            auth: {
                scope: [ "admin", "teacher", "student" ],
            },
            validate: {
                params: Joi.object({
                    id: UUID_SCHEMA.required(),
                }),
            },
            response: {
                schema: DEMERIT_SCHEMA,
            },
        },
        handler: async (request, h) =>
        {
            const demerit = await Demerit.retrieve(request.params.id);

            if (!demerit)
            {
                throw Boom.notFound();
            }

            const user = request.auth.credentials.user as User;

            if (user.data.type === "student" && user.data.email !== demerit.data.student)
            {
                throw Boom.forbidden();
            }

            return demerit.serialize();
        },
    });

    server.route({
        method: "POST",
        path: "/demerits",
        options: {
            tags: [ "api" ],
            auth: {
                scope: [ "admin", "teacher" ],
            },
            validate: {
                payload: DEMERIT_CREATE_SCHEMA,
            },
            response: {
                schema: DEMERIT_SCHEMA,
            },
        },
        handler: async (request, h) =>
        {
            const author = request.auth.credentials.user as User;

            const demerit = await Demerit.create(request.payload as any, author);

            return demerit.serialize();
        },
    });

    server.route({
        method: "DELETE",
        path: "/demerits/{id}",
        options: {
            tags: [ "api" ],
            auth: {
                scope: [ "admin", "teacher" ],
            },
            validate: {
                params: Joi.object({
                    id: UUID_SCHEMA.required(),
                }),
            },
        },
        handler: async (request, h) =>
        {
            const demerit = await Demerit.retrieve(request.params.id);

            if (!demerit)
            {
                throw Boom.notFound();
            }

            const user = request.auth.credentials.user as User;

            if (user.data.type === "teacher" && user.data.email !== demerit.data.author)
            {
                throw Boom.forbidden();
            }

            await demerit.delete();

            return h.response();
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
            response: {
                schema: GRADE_SCHEMA,
            },
        },
        handler: async (request, h) =>
        {
            const grade = await Grade.create(request.payload as any);

            return grade.serialize();
        },
    });

    server.route({
        method: "DELETE",
        path: "/grades/{id}",
        options: {
            tags: [ "api" ],
            auth: {
                scope: [ "admin" ],
            },
            validate: {
                params: Joi.object({
                    id: UUID_SCHEMA.required(),
                }),
            },
        },
        handler: async (request, h) =>
        {
            const grade = await Grade.retrieve(request.params.id);

            if (!grade)
            {
                throw Boom.notFound();
            }

            await grade.delete();

            return h.response();
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
            response: {
                schema: SESSION_SCHEMA,
            },
        },
        handler: async (request, h) =>
        {
            const session = await Session.create(request.payload as any);

            return session.serialize();
        },
    });

    server.route({
        method: "DELETE",
        path: "/sessions/{id}",
        options: {
            tags: [ "api" ],
            auth: {
                scope: [ "admin", "teacher", "student" ],
            },
            validate: {
                params: Joi.object({
                    id: UUID_SCHEMA.required(),
                }),
            },
        },
        handler: async (request, h) =>
        {
            const session = await Session.retrieve(request.params.id);

            if (!session)
            {
                throw Boom.notFound();
            }

            const user = request.auth.credentials.user as User;

            if (session.user.data.email !== user.data.email)
            {
                throw Boom.forbidden();
            }

            await session.delete();

            return h.response();
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
            validate: {
                params: Joi.object({
                    id: EMAIL_SCHEMA.required(),
                }),
            },
            response: {
                schema: STUDENT_SCHEMA,
            },
        },
        handler: GET_STUDENT_HANDLER,
    });

    server.route({
        method: "GET",
        path: "/students/{id}/absences",
        options: {
            tags: [ "api" ],
            auth: {
                scope: [ "admin", "teacher", "student" ],
            },
            validate: {
                params: Joi.object({
                    id: EMAIL_SCHEMA.required(),
                }),
            },
            response: {
                schema: Joi.array().items(ABSENCE_SCHEMA).required().label("Absences"),
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

            const absences = await Absence.for(student);

            return Promise.all(absences.map(_ => _.serialize()));
        },
    });

    server.route({
        method: "GET",
        path: "/students/{id}/demerits",
        options: {
            tags: [ "api" ],
            auth: {
                scope: [ "admin", "teacher", "student" ],
            },
            validate: {
                params: Joi.object({
                    id: EMAIL_SCHEMA.required(),
                }),
            },
            response: {
                schema: Joi.array().items(DEMERIT_SCHEMA).required().label("Demerits"),
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

            const demerits = await Demerit.for(student);

            return Promise.all(demerits.map(_ => _.serialize()));
        },
    });

    server.route({
        method: "GET",
        path: "/students/{id}/grades",
        options: {
            tags: [ "api" ],
            auth: {
                scope: [ "admin", "teacher", "student" ],
            },
            validate: {
                params: Joi.object({
                    id: EMAIL_SCHEMA.required(),
                }),
            },
            response: {
                schema: Joi.array().items(GRADE_SCHEMA).required().label("Grades"),
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
        method: "GET",
        path: "/students/{id}/report",
        options: {
            tags: [ "api" ],
            auth: {
                scope: [ "admin", "teacher", "student" ],
            },
            validate: {
                params: Joi.object({
                    id: EMAIL_SCHEMA.required(),
                }),
            },
            response: {
                schema: STUDENT_REPORT_SCHEMA,
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

            return student.report();
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
                params: Joi.object({
                    id: EMAIL_SCHEMA.required(),
                }),
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
            response: {
                schema: Joi.array().items(SUBJECT_SCHEMA).required().label("Subjects"),
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
            response: {
                schema: SUBJECT_SCHEMA,
            },
        },
        handler: async (request, h) =>
        {
            const subject = await Subject.create(request.payload as any);

            return subject.serialize();
        },
    });

    server.route({
        method: "PUT",
        path: "/subjects/{id}",
        options: {
            tags: [ "api" ],
            validate: {
                params: Joi.object({
                    id: Joi.string().required(),
                }),
                payload: SUBJECT_UPDATE_SCHEMA,
            },
            response: {
                schema: SUBJECT_SCHEMA,
            },
        },
        handler: async (request, h) =>
        {
            const subject = await Subject.retrieve(request.params.id);

            if (!subject)
            {
                throw Boom.notFound();
            }

            await subject.update(request.payload as any);

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
            validate: {
                params: Joi.object({
                    id: EMAIL_SCHEMA.required(),
                }),
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
            validate: {
                params: Joi.object({
                    id: EMAIL_SCHEMA.required(),
                }),
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
            validate: {
                params: Joi.object({
                    id: EMAIL_SCHEMA.required(),
                }),
            },
            response: {
                schema: Joi.array().items(TEACHING_SCHEMA).required().label("Teachings"),
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
        method: "GET",
        path: "/teachers/{id}/subjects",
        options: {
            tags: [ "api" ],
            auth: {
                scope: [ "admin", "teacher" ],
            },
            validate: {
                params: Joi.object({
                    id: EMAIL_SCHEMA.required(),
                }),
            },
            response: {
                schema: Joi.array().items(SUBJECT_SCHEMA).required().label("Subjects"),
            },
        },
        handler: async (request, h) =>
        {
            const teacher = await Teacher.retrieve(request.params.id);

            if (!teacher)
            {
                throw Boom.notFound();
            }

            const subjects = await Subject.for(teacher);

            return Promise.all(subjects.map(_ => _.serialize()));
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
                params: Joi.object({
                    id: EMAIL_SCHEMA.required(),
                }),
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
        method: "GET",
        path: "/teachings",
        options: {
            tags: [ "api" ],
            response: {
                schema: Joi.array().items(TEACHING_SCHEMA).required().label("Teachings"),
            },
        },
        handler: async (request, h) =>
        {
            const teachings = await Teaching.list();

            return Promise.all(teachings.map(_ => _.serialize()));
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
            response: {
                schema: TEACHING_SCHEMA,
            },
        },
        handler: async (request, h) =>
        {
            const teaching = await Teaching.create(request.payload as any);

            return teaching.serialize();
        },
    });

    server.route({
        method: "DELETE",
        path: "/teachings/{id}",
        options: {
            tags: [ "api" ],
            validate: {
                params: Joi.object({
                    id: UUID_SCHEMA.required(),
                }),
            },
        },
        handler: async (request, h) =>
        {
            const teaching = await Teaching.retrieve(request.params.id);

            if (!teaching)
            {
                throw Boom.notFound();
            }

            await teaching.delete();

            return h.response();
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
                    id: EMAIL_SCHEMA.required(),
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
                    id: EMAIL_SCHEMA.required(),
                }),
            },
        },
        handler: async (request, h) =>
        {
            const user = await User.retrieve(request.params.id);

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
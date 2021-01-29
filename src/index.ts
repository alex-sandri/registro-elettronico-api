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
import Session from "./models/Session";
import Admin from "./models/Admin";
import Database from "./utilities/Database";
import User from "./models/User";
import {
    ADMIN_CREATE_SCHEMA,
    ADMIN_UPDATE_SCHEMA,
    CLASS_CREATE_SCHEMA,
    GRADE_CREATE_SCHEMA,
    SESSION_CREATE_SCHEMA,
    STUDENT_CREATE_SCHEMA,
    STUDENT_UPDATE_SCHEMA,
    SUBJECT_CREATE_SCHEMA,
    TEACHER_CREATE_SCHEMA,
    TEACHER_UPDATE_SCHEMA,
    TEACHING_CREATE_SCHEMA,
} from "./config/Schemas";

Database.init();

const server = Hapi.server({
    port: 4000,
    routes: {
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
        options: {
            validate: {
                payload: ADMIN_CREATE_SCHEMA,
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
            validate: {
                payload: ADMIN_UPDATE_SCHEMA,
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

            return Promise.all(students.map(_ => _.serialize()));
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
        method: "POST",
        path: "/sessions",
        options: {
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

            return Promise.all(grades.map(_ => _.serialize()));
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

            return Promise.all(subjects.map(_ => _.serialize()));
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

            return Promise.all(teachers.map(_ => _.serialize()));
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
        options: {
            validate: {
                payload: TEACHER_CREATE_SCHEMA,
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
            auth: {
                scope: [ "admin", "teacher" ],
            },
            validate: {
                payload: TEACHER_UPDATE_SCHEMA,
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
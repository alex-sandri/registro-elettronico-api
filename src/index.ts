import Api from "@alex-sandri/api";
import Response from "@alex-sandri/api/lib/utilities/Response";
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

Database.init();

const checkAuth = (types: TAuthTokenType[]): (token: string, response: Response) => Promise<boolean> =>
{
    return async (token: string, response: Response) =>
    {
        const authToken = await AuthToken.retrieve(token);

        if (!authToken)
        {
            response.unauthorized();

            return false;
        }

        if (!types.includes(authToken.type))
        {
            response.forbidden();

            return false;
        }

        return true;
    }
}

/*
        updateStudent: Resolver.init([ "admin", "student" ], async (args, token) =>
        {
            if (token.type === "student")
            {
                if (args.email !== token.user.data.email)
                {
                    throw new ForbiddenError("Forbidden");
                }
            }

            const student = await Student.retrieve(args.email);

            if (!student)
            {
                throw new Error("This student does not exist");
            }

            return student.update({
                firstName: args.firstName,
                lastName: args.lastName,
                email: args.email,
                password: args.password,
                class: args.class,
            });
        }),
        updateTeacher: Resolver.init([ "admin", "teacher" ], async (args, token) =>
        {
            if (token.type === "teacher")
            {
                if (args.email !== token.user.data.email)
                {
                    throw new ForbiddenError("Forbidden");
                }
            }

            const teacher = await Teacher.retrieve(args.email);

            if (!teacher)
            {
                throw new Error("This teacher does not exist");
            }

            return teacher.update({
                firstName: args.firstName,
                lastName: args.lastName,
                email: args.email,
                password: args.password,
            });
        }),
        updateAdmin: Resolver.init([ "admin" ], async (args, token) =>
        {
            if (token.type === "admin")
            {
                if (args.email !== token.user.data.email)
                {
                    throw new ForbiddenError("Forbidden");
                }
            }

            const admin = await Admin.retrieve(args.email);

            if (!admin)
            {
                throw new Error("This admin does not exist");
            }

            return admin.update({
                firstName: args.firstName,
                lastName: args.lastName,
                email: args.email,
                password: args.password,
            });
        }),
*/

const api = new Api({
    port: 4000,
    endpoints: [
        {
            method: "GET",
            url: "/admins",
            checkAuth: checkAuth([ "admin" ]),
            callback: async (request, response) =>
            {
                const admins = await Admin.list();

                response.body.data = [];

                for (const admin of admins)
                {
                    response.body.data.push(await admin.serialize());
                }

                response.send();
            },
        },
        {
            method: "GET",
            url: "/admins/:id",
            checkAuth: checkAuth([ "admin", "teacher" ]),
            callback: async (request, response) =>
            {
                const admin = await Admin.retrieve(request.params.id);

                if (!admin)
                {
                    response.notFound();

                    return;
                }

                response.body.data = await admin.serialize();

                response.send();
            },
        },
        {
            method: "POST",
            url: "/admins",
            checkAuth: checkAuth([ "admin" ]),
            callback: async (request, response) =>
            {
                const admin = await Admin.create(request.body);

                response.body.data = await admin.serialize();

                response.send();
            },
        },
        {
            method: "GET",
            url: "/classes",
            checkAuth: checkAuth([ "admin" ]),
            callback: async (request, response) =>
            {
                const classes = await Class.list();

                response.body.data = [];

                for (const item of classes)
                {
                    response.body.data.push(await item.serialize());
                }

                response.send();
            },
        },
        {
            method: "GET",
            url: "/classes/:id",
            checkAuth: checkAuth([ "admin", "teacher" ]),
            callback: async (request, response) =>
            {
                const retrievedClass = await Class.retrieve(request.params.id);

                if (!retrievedClass)
                {
                    response.notFound();

                    return;
                }

                response.body.data = await retrievedClass.serialize();

                response.send();
            },
        },
        {
            method: "POST",
            url: "/classes",
            checkAuth: checkAuth([ "admin" ]),
            callback: async (request, response) =>
            {
                const createdClass = await Class.create(request.body);

                response.body.data = await createdClass.serialize();

                response.send();
            },
        },
        {
            method: "POST",
            url: "/grades",
            checkAuth: checkAuth([ "teacher" ]),
            callback: async (request, response) =>
            {
                const grade = await Grade.create(request.body);

                response.body.data = await grade.serialize();

                response.send();
            },
        },
        {
            method: "GET",
            url: "/students",
            checkAuth: checkAuth([ "admin" ]),
            callback: async (request, response) =>
            {
                const students = await Teacher.list();

                response.body.data = [];

                for (const student of students)
                {
                    response.body.data.push(await student.serialize());
                }

                response.send();
            },
        },
        {
            method: "GET",
            url: "/students/:id",
            checkAuth: checkAuth([ "admin", "teacher", "student" ]),
            callback: async (request, response) =>
            {
                const student = await Student.retrieve(request.params.id);

                if (!student)
                {
                    response.notFound();

                    return;
                }

                // TODO:
                // Check that the authenticated user can access this user data

                response.body.data = await student.serialize();

                response.send();
            },
        },
        {
            method: "POST",
            url: "/students",
            checkAuth: checkAuth([ "admin" ]),
            callback: async (request, response) =>
            {
                const student = await Student.create(request.body);

                response.body.data = await student.serialize();

                response.send();
            },
        },
        {
            method: "GET",
            url: "/subjects",
            checkAuth: checkAuth([ "admin", "teacher", "student" ]),
            callback: async (request, response) =>
            {
                const subjects = await Subject.list();

                response.body.data = [];

                for (const subject of subjects)
                {
                    response.body.data.push(await subject.serialize());
                }

                response.send();
            },
        },
        {
            method: "POST",
            url: "/subjects",
            checkAuth: checkAuth([ "admin" ]),
            callback: async (request, response) =>
            {
                const subject = await Subject.create(request.body);

                response.body.data = await subject.serialize();

                response.send();
            },
        },
        {
            method: "GET",
            url: "/teachers",
            checkAuth: checkAuth([ "admin" ]),
            callback: async (request, response) =>
            {
                const teachers = await Teacher.list();

                response.body.data = [];

                for (const teacher of teachers)
                {
                    response.body.data.push(await teacher.serialize());
                }

                response.send();
            },
        },
        {
            method: "GET",
            url: "/teachers/:id",
            checkAuth: checkAuth([ "admin", "teacher" ]),
            callback: async (request, response) =>
            {
                const teacher = await Teacher.retrieve(request.params.id);

                if (!teacher)
                {
                    response.notFound();

                    return;
                }

                response.body.data = await teacher.serialize();

                response.send();
            },
        },
        {
            method: "POST",
            url: "/teachers",
            checkAuth: checkAuth([ "admin" ]),
            callback: async (request, response) =>
            {
                const teacher = await Teacher.create(request.body);

                response.body.data = await teacher.serialize();

                response.send();
            },
        },
        {
            method: "POST",
            url: "/teachings",
            checkAuth: checkAuth([ "admin" ]),
            callback: async (request, response) =>
            {
                const teaching = await Teaching.create(request.body);

                response.body.data = await teaching.serialize();

                response.send();
            },
        },
        {
            method: "POST",
            url: "/tokens",
            callback: async (request, response) =>
            {
                const token = await AuthToken.create(request.body);

                response.body.data = await token.serialize();

                response.send();
            },
        },
        {
            method: "GET",
            url: "/users",
            checkAuth: checkAuth([ "admin" ]),
            callback: async (request, response) =>
            {
                const users = await User.list();

                response.body.data = [];

                for (const user of users)
                {
                    response.body.data.push(await user.serialize());
                }

                response.send();
            },
        },
        {
            method: "GET",
            url: "/users/:id",
            checkAuth: checkAuth([ "admin", "teacher", "student" ]),
            callback: async (request, response) =>
            {
                const id = request.params.id;

                let user = await User.retrieve(id);

                if (!user)
                {
                    response.notFound();

                    return;
                }

                // TODO:
                // Check that the authenticated user can access this user data

                switch (user.data.type)
                {
                    case "admin": user = await Admin.retrieve(id) as Admin; break;
                    case "student": user = await Student.retrieve(id) as Student; break;
                    case "teacher": user = await Teacher.retrieve(id) as Teacher; break;
                }

                response.body.data = await user.serialize();

                response.send();
            },
        },
    ],
});

api.listen();
import express from "express";
import cors from "cors";
import helmet from "helmet";
import bearerToken from "express-bearer-token";
import dotenv from "dotenv";

dotenv.config();

import Student from "./models/Student";
import Grade from "./models/Grade";
import Class from "./models/Class";
import Subject from "./models/Subject";
import Teacher from "./models/Teacher";
import Resolver from "./utilities/Resolver";
import Teaching from "./models/Teaching";
import AuthToken from "./models/AuthToken";
import Admin from "./models/Admin";
import Database from "./utilities/Database";
import User from "./models/User";

Database.init();

const app = express();

app.use(cors());
app.use(helmet());
app.use(bearerToken());

app.use(express.json());

const resolvers = {
    Query: {
        admins: Resolver.init<Admin>([ "admin" ], Admin.list),
        class: Resolver.init<Class>([ "admin", "teacher" ], async args =>
        {
            const retrievedClass = await Class.retrieve(args.id);

            if (!retrievedClass)
            {
                throw new Error("This class does not exist");
            }

            return retrievedClass;
        }),
        classes: Resolver.init<Class>([ "admin" ], Class.list),
        student: Resolver.init<Student>([ "admin", "teacher", "student" ], async args =>
        {
            const student = await Student.retrieve(args.id);

            if (!student)
            {
                throw new Error("This student does not exist");
            }

            return student;
        }),
        students: Resolver.init<Student>([ "admin" ], Student.list),
        subjects: Resolver.init<Subject>([ "admin", "teacher", "student" ], Subject.list),
        teacher: Resolver.init<Teacher>([ "admin", "teacher" ], async args =>
        {
            const teacher = await Teacher.retrieve(args.id);

            if (!teacher)
            {
                throw new Error("This teacher does not exist");
            }

            return teacher;
        }),
        teachers: Resolver.init<Teacher>([ "admin" ], Teacher.list),
        user: Resolver.init<User>([ "admin", "teacher", "student" ], async args =>
        {
            let user = await User.retrieve(args.id);

            if (!user)
            {
                throw new Error("This user does not exist");
            }

            switch (user.data.type)
            {
                case "admin": user = await Admin.retrieve(args.id) as Admin; break;
                case "student": user = await Student.retrieve(args.id) as Student; break;
                case "teacher": user = await Teacher.retrieve(args.id) as Teacher; break;
            }

            return user;
        }),
        users: Resolver.init<User>([ "admin" ], User.list),
    },
    Mutation: {
        createClass: Resolver.init([ "admin" ], Class.create),
        createGrade: Resolver.init([ "teacher" ], args =>
        {
            args.timestamp = new Date(args.timestamp);

            return Grade.create(args);
        }),
        createStudent: Resolver.init([ "admin" ], Student.create),
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
        createSubject: Resolver.init([ "admin" ], Subject.create),
        createTeacher: Resolver.init([ "admin" ], Teacher.create),
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
        createTeaching: Resolver.init([ "admin" ], Teaching.create),
        createAuthToken: async (parent: any, args: any, context: any, info: any) =>
        {
            const token = await AuthToken.create(args);

            return token.serialize();
        },
        createAdmin: Resolver.init([ "admin" ], Admin.create),
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
    },
    User: {
        __resolveType(obj: any, context: any, info: any)
        {
            if (obj.class)
            {
                return "Student";
            }
            else if (obj.teachings)
            {
                return "Teacher";
            }
            else
            {
                return "Admin";
            }
        },
    },
};

const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) =>
    {
        // Save the Bearer Token in the context
        const token = req.headers.authorization?.split(" ")[1] ?? "";

        return { token };
    },
});

server.listen({ port: 4000 });
import { ApolloServer, ForbiddenError, gql, IResolvers } from "apollo-server";

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

const typeDefs = gql`
    enum UserType
    {
        ADMIN
        STUDENT
        TEACHER
    }

    union User = Admin | Teacher | Student

    type Admin
    {
        type: String!
        firstName: String!
        lastName: String!
        email: String!
    }

    type AuthToken
    {
        id: String!
        type: UserType!
        user: User!
    }

    type Class
    {
        name: String!
        students: [Student!]!
    }

    type ClassWithoutStudents
    {
        name: String!
    }

    type Grade
    {
        value: Float!
        timestamp: String!
        description: String!
        subject: Subject!
    }

    type Student
    {
        type: String!
        firstName: String!
        lastName: String!
        email: String!
        grades: [Grade!]!
        class: ClassWithoutStudents!
    }

    type Subject
    {
        name: String!
        description: String!
    }

    type Teacher
    {
        type: String!
        firstName: String!
        lastName: String!
        email: String!
        classes: [Class!]!
        teachings: [Teaching!]!
    }

    type TeacherWithoutTeachings
    {
        firstName: String!
        lastName: String!
        email: String!
    }

    type Teaching
    {
        teacher: TeacherWithoutTeachings!
        class: Class!
        subject: Subject!
    }

    type Query
    {
        class(id: ID!): Class

        student(id: ID!): Student

        subjects: [Subject!]!

        teacher(id: ID!): Teacher

        user(id: ID!): User
    }

    type Mutation
    {
        createClass(
            name: String!
        ): Class

        createGrade(
            value: Float!
            timestamp: String!
            description: String!

            student: String!
            subject: String!
        ): Grade

        createStudent(
            firstName: String!
            lastName: String!
            email: String!
            password: String!

            class: String!
        ): Student

        updateStudent(
            firstName: String
            lastName: String
            email: String!
            password: String

            class: String
        ): Student

        createSubject(
            name: String!
            description: String!
        ): Subject

        createTeacher(
            firstName: String!
            lastName: String!
            email: String!
            password: String!
        ): Teacher

        updateTeacher(
            firstName: String
            lastName: String
            email: String!
            password: String
        ): Teacher

        createTeaching(
            teacher: String!
            class: String!
            subject: String!
        ): Teaching

        createAuthToken(
            email: String!
            password: String!
        ): AuthToken

        createAdmin(
            firstName: String!
            lastName: String!
            email: String!
            password: String!
        ): Admin

        updateAdmin(
            firstName: String
            lastName: String
            email: String!
            password: String
        ): Admin
    }
`;

const resolvers: IResolvers = {
    Query: {
        class: Resolver.init([ "admin", "teacher" ], async args =>
        {
            const retrievedClass = await Class.retrieve(args.id);

            if (!retrievedClass)
            {
                throw new Error("This class does not exist");
            }

            return retrievedClass;
        }),
        student: Resolver.init([ "admin", "teacher", "student" ], async args =>
        {
            const student = await Student.retrieve(args.id);

            if (!student)
            {
                throw new Error("This student does not exist");
            }

            return student;
        }),
        subjects: Resolver.init([ "admin", "teacher", "student" ], Subject.list),
        teacher: Resolver.init([ "admin", "teacher" ], async args =>
        {
            const teacher = await Teacher.retrieve(args.id);

            if (!teacher)
            {
                throw new Error("This teacher does not exist");
            }

            return teacher;
        }),
        user: Resolver.init([ "admin", "teacher", "student" ], async args =>
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
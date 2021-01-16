import { ApolloServer, ForbiddenError, gql, IResolvers } from "apollo-server";
import { GraphQLDate } from "graphql-iso-date";
import { GraphQLEmail, GraphQLPassword } from "graphql-custom-types";

import Student from "./models/Student";
import Grade from "./models/Grade";
import Class from "./models/Class";
import Subject from "./models/Subject";
import Teacher from "./models/Teacher";
import Resolver from "./utilities/Resolver";
import Teaching from "./models/Teaching";
import AuthToken from "./utilities/AuthToken";

const typeDefs = gql`
    scalar Date
    scalar Email
    scalar Password

    enum AuthTokenType
    {
        ADMIN
        STUDENT
        TEACHER
    }

    union AuthTokenUser = Teacher | Student

    type AuthToken
    {
        id: String!
        type: AuthTokenType!
        user: AuthTokenUser!
    }

    type Class
    {
        name: String!
    }

    type Grade
    {
        value: Float!
        timestamp: Date!
        description: String!
    }

    type Student
    {
        firstName: String!
        lastName: String!
        email: Email!
        grades: [Grade!]!
        class: Class!
    }

    type Subject
    {
        name: String!
        description: String!
    }

    type Teacher
    {
        firstName: String!
        lastName: String!
        email: Email!
        teachings: [Teaching!]!
    }

    type Teaching
    {
        teacher: Teacher!
        class: Class!
        subject: Subject!
    }

    type Query
    {
        student(id: ID!): Student

        teacher(id: ID!): Teacher
    }

    type Mutation
    {
        createClass(
            name: String!
        ): Class

        createGrade(
            value: Float!
            timestamp: Date!
            description: String!

            student: String!
        ): Grade

        createStudent(
            firstName: String!
            lastName: String!
            email: Email!
            password: Password!

            class: String!
        ): Student

        updateStudent(
            firstName: String
            lastName: String
            email: Email!
            password: Password

            class: String
        ): Student

        createSubject(
            name: String!
            description: String!
        ): Subject

        createTeacher(
            firstName: String!
            lastName: String!
            email: Email!
            password: Password!
        ): Teacher

        updateTeacher(
            firstName: String
            lastName: String
            email: Email!
            password: Password
        ): Teacher

        createTeaching(
            teacher: String!
            class: String!
            subject: String!
        ): Teaching

        createAuthToken(
            type: AuthTokenType!
            email: Email!
            password: Password!
        ): AuthToken
    }
`;

const resolvers: IResolvers = {
    Query: {
        student: Resolver.init([ "admin", "teacher", "student" ], async args =>
        {
            const student = await Student.retrieve(args.id);

            if (!student)
            {
                throw new Error("This student does not exist");
            }

            return student;
        }),
        teacher: Resolver.init([ "admin", "teacher" ], async args =>
        {
            const teacher = await Teacher.retrieve(args.id);

            if (!teacher)
            {
                throw new Error("This teacher does not exist");
            }

            return teacher;
        }),
    },
    Mutation: {
        createClass: Resolver.init([ "admin" ], Class.create),
        createGrade: Resolver.init([ "teacher" ], Grade.create),
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
            args.type = (args.type as string).toLowerCase();

            const token = await AuthToken.create(args);

            return token.serialize();
        },
    },
    Date: GraphQLDate,
    Email: GraphQLEmail,
    Password: new GraphQLPassword(8),
    AuthTokenUser: {
        __resolveType(obj: any, context: any, info: any)
        {
            if(obj.class)
            {
                return "Student";
            }
            else
            {
                return "Teacher";
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
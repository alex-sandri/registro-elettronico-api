import { ApolloServer, gql, IResolvers } from "apollo-server";
import { GraphQLDate } from "graphql-iso-date";
import { GraphQLEmail, GraphQLPassword } from "graphql-custom-types";

import Student from "./models/Student";
import Grade from "./models/Grade";
import Class from "./models/Class";
import Subject from "./models/Subject";
import Teacher from "./models/Teacher";
import Resolver from "./utilities/Resolver";
import Teaching from "./models/Teaching";

const typeDefs = gql`
    scalar Date
    scalar Email
    scalar Password

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
    }
`;

const resolvers: IResolvers = {
    Query: {
        student: Resolver.init([ "admin", "teacher", "student" ], async args => Student.retrieve(args.id)),
        teacher: Resolver.init([ "admin", "teacher" ], async args => Teacher.retrieve(args.id)),
    },
    Mutation: {
        createClass: Resolver.init([ "admin" ], Class.create),
        createGrade: Resolver.init([ "teacher" ], Grade.create),
        createStudent: Resolver.init([ "admin" ], Student.create),
        updateStudent: Resolver.init([ "admin", "student" ], async args =>
        {
            const student = await Student.retrieve(args.email);

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
        updateTeacher: Resolver.init([ "admin", "teacher" ], async args =>
        {
            const teacher = await Teacher.retrieve(args.email);

            return teacher.update({
                firstName: args.firstName,
                lastName: args.lastName,
                email: args.email,
                password: args.password,
            });
        }),
        createTeaching: Resolver.init([ "admin" ], Teaching.create),
    },
    Date: GraphQLDate,
    Email: GraphQLEmail,
    Password: new GraphQLPassword(8),
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
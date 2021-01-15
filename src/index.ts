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
        student: Resolver.init(async args => Student.retrieve(args.id)),
        teacher: Resolver.init(async args => Teacher.retrieve(args.id)),
    },
    Mutation: {
        createClass: Resolver.init(Class.create),
        createGrade: Resolver.init(Grade.create),
        createStudent: Resolver.init(Student.create),
        updateStudent: Resolver.init(async args =>
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
        createSubject: Resolver.init(Subject.create),
        createTeacher: Resolver.init(Teacher.create),
        updateTeacher: Resolver.init(async args =>
        {
            const teacher = await Teacher.retrieve(args.email);

            return teacher.update({
                firstName: args.firstName,
                lastName: args.lastName,
                email: args.email,
                password: args.password,
            });
        }),
        createTeaching: Resolver.init(Teaching.create),
    },
    Date: GraphQLDate,
    Email: GraphQLEmail,
    Password: new GraphQLPassword(8),
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen({ port: 4000 });
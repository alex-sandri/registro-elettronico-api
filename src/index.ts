import * as admin from "firebase-admin";
import { ApolloServer, gql, IResolvers } from "apollo-server";
import { GraphQLDate } from "graphql-iso-date";
import { GraphQLEmail, GraphQLPassword } from "graphql-custom-types";

const serviceAccount = require("./service-account.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://registro--elettronico.firebaseio.com",
});

import Student from "./models/Student";
import Grade from "./models/Grade";
import Class from "./models/Class";
import Subject from "./models/Subject";
import Teacher from "./models/Teacher";
import Resolver from "./utilities/Resolver";

const typeDefs = gql`
    scalar Date
    scalar Email
    scalar Password

    type Class
    {
        id: ID!
        description: String!
    }

    type Grade
    {
        id: ID!
        value: Float!
        date: Date!
        description: String
    }

    type Student
    {
        id: ID!
        firstName: String!
        lastName: String!
        email: Email!
        grades: [Grade!]!
        class: Class!
    }

    type Subject
    {
        id: ID!
        name: String!
        description: String
    }

    type Teacher
    {
        id: ID!
        firstName: String!
        lastName: String!
        email: Email!
        classes: [Class!]!
    }

    type Query
    {
        student(id: ID!): Student
    }

    type Mutation
    {
        createClass(
            description: String!
        ): Class

        createGrade(
            student: String!
            value: Float!
            date: Date!
            description: String
        ): Grade

        createStudent(
            firstName: String!
            lastName: String!
            email: Email!
            password: Password!
            class: String!
        ): Student

        updateStudent(
            id: ID!,
            firstName: String
            lastName: String
            email: Email
            password: Password
            class: String
        ): Student

        createSubject(
            name: String!
            description: String
        ): Subject

        createTeacher(
            firstName: String!
            lastName: String!
            email: Email!
            password: Password!
        ): Teacher

        updateTeacher(
            id: ID!,
            firstName: String
            lastName: String
            email: Email
            password: Password
        ): Teacher
    }
`;

const resolvers: IResolvers = {
    Query: {
        student: new Resolver(Student.retrieve).use,
    },
    Mutation: {
        createClass: new Resolver(Class.create).use,
        createGrade: new Resolver(Grade.create).use,
        createStudent: new Resolver(Student.create).use,
        updateStudent: new Resolver(async args =>
        {
            const { data: student } = await Student.retrieve(args.id);

            if (!student)
            {
                // TODO

                return;
            }

            return student.update({
                firstName: args.firstName,
                lastName: args.lastName,
                email: args.email,
                password: args.password,
                class: args.class,
            });
        }).use,
        createSubject: new Resolver(Subject.create).use,
        createTeacher: new Resolver(Teacher.create).use,
        updateTeacher: new Resolver(async args =>
        {
            const { data: teacher } = await Teacher.retrieve(args.id);

            if (!teacher)
            {
                // TODO

                return;
            }

            return teacher.update({
                firstName: args.firstName,
                lastName: args.lastName,
                email: args.email,
                password: args.password,
            });
        }).use,
    },
    Date: GraphQLDate,
    Email: GraphQLEmail,
    Password: new GraphQLPassword(8),
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen({ port: 4000 });
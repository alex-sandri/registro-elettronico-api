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
        student: new Resolver(async args =>
        {
            const student = await Student.retrieve(args.id);

            return student.serialize();
        }).use,
    },
    Mutation: {
        createClass: new Resolver(async args =>
        {
            const createdClass = await Class.create(args);

            return createdClass.serialize();
        }).use,
        createGrade: new Resolver(async args =>
        {
            const grade = await Grade.create(args);

            return grade.serialize();
        }).use,
        createStudent: new Resolver(async args =>
        {
            const student = await Student.create(args);

            return student.serialize();
        }).use,
        updateStudent: new Resolver(async args =>
        {
            const student = await Student.retrieve(args.id);

            await student.update({
                firstName: args.firstName,
                lastName: args.lastName,
                email: args.email,
                password: args.password,
                class: args.class,
            });

            return student.serialize();
        }).use,
        createSubject: new Resolver(async args =>
        {
            const subject = await Subject.create(args);

            return subject.serialize();
        }).use,
        createTeacher: new Resolver(async args =>
        {
            const teacher = await Teacher.create(args);

            return teacher.serialize();
        }).use,
        updateTeacher: new Resolver(async args =>
        {
            const teacher = await Teacher.create({
                firstName: args.firstName,
                lastName: args.lastName,
                email: args.email,
                password: args.password,
            });

            return teacher.serialize();
        }).use,
    },
    Date: GraphQLDate,
    Email: GraphQLEmail,
    Password: new GraphQLPassword(8),
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen({ port: 4000 });
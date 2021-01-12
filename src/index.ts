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

const typeDefs = gql`
    scalar Date
    scalar Email
    scalar Password

    type Student
    {
        id: ID!
        firstName: String!
        lastName: String!
        email: Email!
        grades: [Grade!]!
    }

    type Grade
    {
        id: ID!
        value: Float!
        date: Date!
        description: String
    }

    type Query
    {
        student(id: ID!): Student
    }

    type Mutation
    {
        createStudent(
            firstName: String!,
            lastName: String!,
            email: Email!,
            password: Password!,
        ): Student

        updateStudent(
            id: ID!,
            firstName: String,
            lastName: String,
            email: Email,
            password: Password,
        ): Student

        createGrade(
            student: String!
            value: Float!
            date: Date!
            description: String
        ): Grade
    }
`;

const resolvers: IResolvers = {
    Query: {
        student: async (parent, args, context, info) =>
        {
            const { serialize } = await Student.retrieve(args.id);

            return serialize();
        },
    },
    Mutation: {
        createStudent: async (parent, args, context, info) =>
        {
            const { serialize } = await Student.create(args);

            return serialize();
        },
        updateStudent: async (parent, args, context, info) =>
        {
            const { update, serialize } = await Student.retrieve(args.id);

            await update({
                firstName: args.firstName,
                lastName: args.lastName,
                email: args.email,
                password: args.password,
            });

            return serialize();
        },
        createGrade: async (parent, args, context, info) =>
        {
            const { serialize } = await Grade.create(args);

            return serialize();
        },
    },
    Date: GraphQLDate,
    Email: GraphQLEmail,
    Password: new GraphQLPassword(8),
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen({ port: 4000 });
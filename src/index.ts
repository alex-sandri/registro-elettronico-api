import * as admin from "firebase-admin";
import { ApolloServer, gql, IResolvers } from "apollo-server";
import { GraphQLDate } from "graphql-iso-date";
import { GraphQLEmail, GraphQLPassword } from "graphql-custom-types";

const serviceAccount = require("./service-account.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://registro--elettronico.firebaseio.com",
});

import User from "./models/User";
import Grade from "./models/Grade";

const typeDefs = gql`
    scalar Date
    scalar Email
    scalar Password

    type User
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
        user(id: ID!): User
    }

    type Mutation
    {
        createUser(
            firstName: String!,
            lastName: String!,
            email: Email!,
            password: Password!,
        ): User

        updateUser(
            id: ID!,
            firstName: String,
            lastName: String,
            email: Email,
            password: Password,
        ): User

        createGrade(
            user: String!
            value: Float!
            date: Date!
            description: String
        ): Grade
    }
`;

const resolvers: IResolvers = {
    Query: {
        user: async (parent, args, context, info) =>
        {
            const user = await User.retrieve(args.id);

            return user.serialize();
        },
    },
    Mutation: {
        createUser: async (parent, args, context, info) =>
        {
            const user = await User.create(args);

            return user.serialize();
        },
        updateUser: async (parent, args, context, info) =>
        {
            const user = await User.retrieve(args.id);

            await user.update({
                firstName: args.firstName,
                lastName: args.lastName,
                email: args.email,
                password: args.password,
            });

            return user.serialize();
        },
        createGrade: async (parent, args, context, info) =>
        {
            const grade = await Grade.create(args);

            return grade.serialize();
        },
    },
    Date: GraphQLDate,
    Email: GraphQLEmail,
    Password: new GraphQLPassword(8),
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen({ port: 4000 });
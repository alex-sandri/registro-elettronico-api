import * as admin from "firebase-admin";
import { ApolloServer, gql, IResolvers } from "apollo-server";
import { GraphQLDate } from "graphql-iso-date";

const serviceAccount = require("./service-account.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://registro--elettronico.firebaseio.com",
});

import User from "./models/User";

const typeDefs = gql`
    scalar Date

    type User
    {
        id: ID!
        firstName: String!
        lastName: String!
        email: String!
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
            email: String!,
            password: String!,
        ): User

        updateUser(
            id: ID!,
            firstName: String,
            lastName: String,
            email: String,
            password: String,
        ): User

        createGrade(
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
    },
    Date: GraphQLDate,
};

const server = new ApolloServer({ typeDefs, resolvers, playground: false });

server.listen({ port: 4000 });
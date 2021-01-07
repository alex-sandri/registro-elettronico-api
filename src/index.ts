import * as admin from "firebase-admin";
import { ApolloServer, gql } from "apollo-server";
import { GraphQLDate } from "graphql-iso-date";

const serviceAccount = require("./service-account.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://registro--elettronico.firebaseio.com",
});

import User, { ISerializedUser, IUser } from "./models/User";

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

    input UserInput
    {
        firstName: String
        lastName: String
        email: String
        password: String
    }

    type Grade
    {
        id: ID!
        value: Float!
        date: Date!
        description: String
    }

    input GradeInput
    {
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
        createUser(data: UserInput!): User
        updateUser(id: ID!, data: UserInput!): User

        createGrade(data: GradeInput!): Grade
    }
`;

const resolvers = {
    Query: {
        user: async (args: { id: string }): Promise<ISerializedUser> =>
        {
            const user = await User.retrieve(args.id);

            return user.serialize();
        },
    },
    Mutation: {
        createUser: async (args: { data: IUser }): Promise<ISerializedUser> =>
        {
            const user = await User.create(args.data);

            return user.serialize();
        },
        updateUser: async (args: { id: string, data: IUser }): Promise<ISerializedUser> =>
        {
            const user = await User.retrieve(args.id);

            await user.update(args.data);

            return user.serialize();
        },
    },
    Date: GraphQLDate,
};

const server = new ApolloServer({ typeDefs, resolvers, playground: false });

server.listen({ port: 4000 });
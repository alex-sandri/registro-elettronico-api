import * as admin from "firebase-admin";
import * as express from "express";
import { graphqlHTTP } from "express-graphql";
import { buildSchema } from "graphql";

const serviceAccount = require("./service-account.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://registro--elettronico.firebaseio.com",
});

import User, { ISerializedUser, IUser } from "./models/User";

const schema = buildSchema(`
    type User
    {
        id: ID!
        firstName: String!
        lastName: String!
    }

    input UserInput
    {
        firstName: String!
        lastName: String!
    }

    type Query
    {
        retrieveUser(id: ID!): User
    }

    type Mutation
    {
        createUser(data: UserInput!): User
        updateUser(id: ID!, data: UserInput!): User
    }
`);

const root = {
    createUser: async (args: { data: IUser }): Promise<ISerializedUser> =>
    {
        const user = await User.create(args.data);

        return user.serialize();
    },
    retrieveUser: async (args: { id: string }): Promise<ISerializedUser> =>
    {
        const user = await User.retrieve(args.id);

        return user.serialize();
    },
    updateUser: async (args: { id: string, data: IUser }): Promise<ISerializedUser> =>
    {
        const user = await User.retrieve(args.id);

        await user.update(args.data);

        return user.serialize();
    },
};

const app = express();

app.use('/graphql', graphqlHTTP({ schema, rootValue: root }));

app.listen(4000);
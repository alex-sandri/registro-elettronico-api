import * as admin from "firebase-admin";
import * as express from "express";
import { graphqlHTTP } from "express-graphql";
import { loadSchemaSync, GraphQLFileLoader } from "graphql-tools";
import * as path from "path";

const serviceAccount = require("./service-account.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://registro--elettronico.firebaseio.com",
});

import User from "./models/User";

const root = {
    user: async (args: { id: string }) =>
    {
        const user = await User.retrieve(args.id);

        return user;
    }
};

const app = express();

app.use('/graphql', graphqlHTTP({
    schema: loadSchemaSync(path.join(__dirname, "../config/schema.graphql"), { loaders: [ new GraphQLFileLoader() ] }),
    rootValue: root,
}));

app.listen(4000);
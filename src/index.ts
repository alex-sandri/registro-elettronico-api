import * as admin from "firebase-admin";
import * as express from "express";
import { graphqlHTTP } from "express-graphql";
import { buildSchema } from "graphql";

const serviceAccount = require("./service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://registro--elettronico.firebaseio.com",
});

const schema = buildSchema(`
    type Query
    {
        hello: String
    }
`);

const root = {
    hello: () => {
      return 'Hello world!';
    },
};

const app = express();

app.use('/graphql', graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true,
}));

app.listen(4000);
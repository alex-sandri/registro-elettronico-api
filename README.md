# API Registro Elettronico

## First steps

### Create the DB
Use [`schema.sql`](schema.sql) to create the required tables.

### Set environment variables
Create a file named `.env` and set the following variables:

- `DATABASE_URL`:
    The URL used to connect to the DB\
    Use this format: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA` and replace `USER`, `PASSWORD`, `HOST`, `PORT`, `DATABASE` and `SCHEMA` according to your DBconfiguration.

- `TOKEN_SECRET`:
    The **secret** token used to generate JWTs for authorization.\
    You can generate one using the Node.js CLI with this command:
    ```javascript
    require('crypto').randomBytes(64).toString('hex')
    ```

### Generate Prisma client

Run `npx prisma generate`.
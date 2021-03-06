# Electronic Class Register API

*Read this in other languages: [English](README.en-US.md), [Italiano](README.md).*

## Requirements
- [`Node.js`](https://nodejs.org/)
- [`PostgreSQL`](https://www.postgresql.org/)

## First steps

### Create the DB
Use [`schema.sql`](schema.sql) to create the required tables.

### Create the first ADMIN user
In the `users` table add a new entry with the required fields and set the `type` field to `admin`.

For the `password` field use the Node.js CLI to hash the password with this command:
```javascript
require("bcrypt").hashSync("PASSWORD", 15)
```
Replace `PASSWORD` with a strong password to prevent unauthorized access.\
__COPY ONLY THE STRING INSIDE THE QUOTATION MARKS__

### Set environment variables
Create a file named `.env` and set the following variables:

- `DATABASE_URL`:
    The URL used to connect to the DB\
    Use this format: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA`
    and replace `USER`, `PASSWORD`, `HOST`, `PORT`, `DATABASE` and `SCHEMA` according to your DB configuration.

### Install the dependencies
Run `npm i`.
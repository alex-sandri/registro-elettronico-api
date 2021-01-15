# API Registro Elettronico

## First steps

### Set environment variables
Create a file named `.env` containing the following:

`DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA`

Replace `USER`, `PASSWORD`, `HOST`, `PORT`, `DATABASE` and `SCHEMA` according to your DB configuration.

### Generate Prisma client

`npx prisma generate`
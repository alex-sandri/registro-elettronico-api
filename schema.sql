CREATE TYPE USERTYPE AS ENUM ('admin', 'student', 'teacher');

CREATE DOMAIN GRADE AS NUMERIC(4, 2) NOT NULL CHECK(value between 0 and 10) CHECK(value % 0.25 = 0);

CREATE TABLE "Class"
(
    "name" VARCHAR(30) NOT NULL,

    PRIMARY KEY ("name")
);

CREATE TABLE "User"
(
    "type" USERTYPE NOT NULL,
    "firstName" VARCHAR(30) NOT NULL,
    "lastName" VARCHAR(30) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,

    PRIMARY KEY ("email")
);

CREATE TABLE "Student"
(
    "email" VARCHAR(255) NOT NULL,
    "class" VARCHAR(30) NOT NULL,

    PRIMARY KEY ("email"),
    FOREIGN KEY ("email") REFERENCES "User" ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY ("class") REFERENCES "Class" ON UPDATE CASCADE
);

CREATE TABLE "Grade"
(
    "id" VARCHAR(255) NOT NULL,
    "value" GRADE NOT NULL,
    "timestamp" TIMESTAMP NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "student" VARCHAR(255) NOT NULL,
    "subject" VARCHAR(30) NOT NULL,

    PRIMARY KEY ("id"),
    FOREIGN KEY ("student") REFERENCES "Student" ON UPDATE CASCADE,
    FOREIGN KEY ("subject") REFERENCES "Subject" ON UPDATE CASCADE,

    CHECK("timestamp" <= CURRENT_DATE)
);

CREATE TABLE "Subject"
(
    "name" VARCHAR(30) NOT NULL,
    "description" VARCHAR(100) NOT NULL,

    PRIMARY KEY ("name")
);

CREATE TABLE "Teacher"
(
    "email" VARCHAR(255) NOT NULL,

    PRIMARY KEY ("email"),
    FOREIGN KEY ("email") REFERENCES "User" ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE "Teaching"
(
    "teacher" VARCHAR(255) NOT NULL,
    "class" VARCHAR(30) NOT NULL,
    "subject" VARCHAR(30) NOT NULL,

    PRIMARY KEY ("class", "teacher", "subject"),
    FOREIGN KEY ("class") REFERENCES "Class" ON UPDATE CASCADE,
    FOREIGN KEY ("teacher") REFERENCES "Teacher" ON UPDATE CASCADE,
    FOREIGN KEY ("subject") REFERENCES "Subject" ON UPDATE CASCADE
);
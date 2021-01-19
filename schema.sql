CREATE TABLE "Class"
(
    "name" VARCHAR(30) NOT NULL,

    PRIMARY KEY ("name")
);

CREATE TYPE USERTYPE AS ENUM ('admin', 'student', 'teacher');

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
    FOREIGN KEY ("email") REFERENCES "User",
    FOREIGN KEY ("class") REFERENCES "Class"
);

CREATE TABLE "Grade"
(
    "id" VARCHAR(255) NOT NULL,
    "value" INT NOT NULL,
    "timestamp" TIMESTAMP NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "student" VARCHAR(255) NOT NULL,
    "subject" VARCHAR(30) NOT NULL,

    PRIMARY KEY ("id"),
    FOREIGN KEY ("student") REFERENCES "Student",
    FOREIGN KEY ("subject") REFERENCES "Subject",

    CHECK("value" > 0 AND "value" <= 10),
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
    FOREIGN KEY ("email") REFERENCES "User"
);

CREATE TABLE "Teaching"
(
    "teacher" VARCHAR(255) NOT NULL,
    "class" VARCHAR(30) NOT NULL,
    "subject" VARCHAR(30) NOT NULL,

    PRIMARY KEY ("class", "teacher", "subject"),
    FOREIGN KEY ("class") REFERENCES "Class",
    FOREIGN KEY ("teacher") REFERENCES "Teacher",
    FOREIGN KEY ("subject") REFERENCES "Subject"
);
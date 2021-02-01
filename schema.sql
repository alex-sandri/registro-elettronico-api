create type usertype as enum ('admin', 'student', 'teacher');

create domain grade as numeric(4, 2) not null check(value between 0 and 10) check(value % 0.25 = 0);

create table "classes"
(
    "name" varchar(30) not null,

    primary key ("name")
);

create table "users"
(
    "type" usertype not null,
    "firstName" varchar(30) not null,
    "lastName" varchar(30) not null,
    "email" varchar(255) not null,
    "password" varchar(255) not null,

    primary key ("email")
);

create table "students"
(
    "email" varchar(255) not null,
    "class" varchar(30) not null,

    primary key ("email"),
    foreign key ("email") references "users" on update cascade on delete cascade,
    foreign key ("class") references "classes" on update cascade
);

create table "subjects"
(
    "name" varchar(30) not null,
    "description" varchar(100) not null,

    primary key ("name")
);

create table "teachers"
(
    "email" varchar(255) not null,

    primary key ("email"),
    foreign key ("email") references "users" on update cascade on delete cascade
);

create table "grades"
(
    "id" varchar(255) not null,
    "value" grade not null,
    "timestamp" timestamp not null,
    "description" varchar(255) not null,
    "student" varchar(255) not null,
    "subject" varchar(30) not null,
    "teacher" varchar(255) not null,

    primary key ("id"),
    foreign key ("student") references "students" on update cascade,
    foreign key ("subject") references "subjects" on update cascade,
    foreign key ("teacher") references "teachers" on update cascade,

    check("timestamp" <= current_timestamp)
);

create table "teachings"
(
    "id" varchar(255) not null,
    "teacher" varchar(255) not null,
    "class" varchar(30) not null,
    "subject" varchar(30) not null,

    primary key ("id"),
    foreign key ("class") references "classes" on update cascade,
    foreign key ("teacher") references "teachers" on update cascade,
    foreign key ("subject") references "subjects" on update cascade
);

create table "sessions"
(
    "id" varchar(255) not null,
    "user" varchar(255) not null,
    "expires" timestamp not null,

    primary key ("id"),
    foreign key ("user") references "users" on update cascade on delete cascade,

    check("expires" > current_timestamp)
);
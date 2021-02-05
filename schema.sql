create extension "pgcrypto";

create type usertype as enum ('admin', 'student', 'teacher');

create type calendar_item_type as enum ('general', 'test', 'event', 'info', 'important');

create domain grade as numeric(4, 2) not null check(value between 0 and 10) check(value % 0.25 = 0);

create function trigger_update_last_modified()
returns trigger as $$
begin
  new.lastModified = current_timestamp;
  return new;
end;
$$ language plpgsql;

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
    "birthday" date not null,

    primary key ("email"),

    check ("birthday" < current_date)
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
    "id" uuid not null default gen_random_uuid(),
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
    "id" uuid not null default gen_random_uuid(),
    "teacher" varchar(255) not null,
    "class" varchar(30) not null,
    "subject" varchar(30) not null,

    primary key ("id"),

    unique ("teacher", "class", "subject"),

    foreign key ("class") references "classes" on update cascade,
    foreign key ("teacher") references "teachers" on update cascade,
    foreign key ("subject") references "subjects" on update cascade
);

create table "sessions"
(
    "id" uuid not null default gen_random_uuid(),
    "user" varchar(255) not null,
    "expires" timestamp not null,

    primary key ("id"),

    foreign key ("user") references "users" on update cascade on delete cascade,

    check("expires" > current_timestamp)
);

create table "calendar_items"
(
    "id" uuid not null default gen_random_uuid(),
    "type" calendar_item_type not null,
    "start" timestamp not null,
    "end" timestamp not null,
    "title" varchar(50) not null,
    "content" varchar(200) not null,
    "author" varchar(255) not null,
    "class" varchar(30) not null,
    "created" timestamp not null default current_timestamp,
    "lastModified" timestamp not null default current_timestamp,

    primary key ("id"),

    foreign key ("author") references "users" on update cascade on delete cascade,
    foreign key ("class") references "classes" on update cascade on delete cascade,

    check ("start" >= "created"),
    check ("end" > "start"),
    check ("lastModified" >= "created")
);

create trigger update_last_modified
before update on "calendar_items"
for each row
execute procedure trigger_update_last_modified();
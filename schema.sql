CREATE TABLE classes (
	name VARCHAR(30) NOT NULL,

	PRIMARY KEY (name)
);

CREATE TABLE grades (
    value INT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    description VARCHAR(255) NOT NULL,
	student VARCHAR(255) NOT NULL,

	PRIMARY KEY (value, timestamp, description),
	FOREIGN KEY (student) REFERENCES students

	CHECK(value > 0 And value <= 10),
	CHECK(timestamp <= CURRENT_DATE)
);

CREATE TABLE students (
	firstName VARCHAR(30) NOT NULL,
    lastName VARCHAR(30) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    class VARCHAR(30) NOT NULL,

	PRIMARY KEY (email),
	FOREIGN KEY (class) REFERENCES classes
);

CREATE TABLE subjects (
	name VARCHAR(30) NOT NULL,
    description VARCHAR(100) NOT NULL,

	PRIMARY KEY (name)
);

CREATE TABLE teachers (
	firstName VARCHAR(30) NOT NULL,
    lastName VARCHAR(30) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,

	PRIMARY KEY (email)
);

CREATE TABLE teachings (
	teacher VARCHAR(255) NOT NULL,
	class VARCHAR(30) NOT NULL,
	subject VARCHAR(30) NOT NULL,

	PRIMARY KEY (class, teacher, subject),
	FOREIGN KEY (class) REFERENCES classes,
	FOREIGN KEY (teacher) REFERENCES teachers,
	FOREIGN KEY (subject) REFERENCES subjects
);
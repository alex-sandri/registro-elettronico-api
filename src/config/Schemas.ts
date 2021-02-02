import Joi from "joi";
import { Config } from "./Config";

// --------------------------------
// MISC
// --------------------------------

export const EMAIL_SCHEMA = Joi.string().email();

export const PASSWORD_SCHEMA = Joi.string().min(Config.PASSWORD_MIN_LENGTH);

export const UUID_SCHEMA = Joi.string().uuid({ version: "uuidv4" });

// --------------------------------
// REQUEST SCHEMAS
// --------------------------------

export const SESSION_CREATE_SCHEMA = Joi.object({
    email: EMAIL_SCHEMA.required(),
    password: PASSWORD_SCHEMA.required(),
});

export const CLASS_CREATE_SCHEMA = Joi.object({
    name: Joi.string()
        .required(),
});

export const GRADE_CREATE_SCHEMA = Joi.object({
    value: Joi.number()
        .min(0)
        .max(10)
        .multiple(0.25)
        .required(),
    timestamp: Joi.date()
        .max("now")
        .iso()
        .required(),
    description: Joi.string()
        .allow("")
        .required(),
    student: EMAIL_SCHEMA.required(),
    subject: Joi.string()
        .required(),
    teacher: EMAIL_SCHEMA.required(),
});

export const SUBJECT_CREATE_SCHEMA = Joi.object({
    name: Joi.string()
        .required(),
    description: Joi.string()
        .allow("")
        .required(),
});

export const TEACHING_CREATE_SCHEMA = Joi.object({
    teacher: EMAIL_SCHEMA.required(),
    class: Joi.string()
        .required(),
    subject: Joi.string()
        .required(),
});

export const USER_CREATE_SCHEMA = Joi.object({
    firstName: Joi.string()
        .required(),
    lastName: Joi.string()
        .required(),
    email: EMAIL_SCHEMA.required(),
    password: PASSWORD_SCHEMA.required(),
});

export const USER_UPDATE_SCHEMA = Joi.object({
    firstName: Joi.string(),
    lastName: Joi.string(),
    email: EMAIL_SCHEMA,
    password: PASSWORD_SCHEMA,
});

export const ADMIN_CREATE_SCHEMA = USER_CREATE_SCHEMA;

export const ADMIN_UPDATE_SCHEMA = USER_UPDATE_SCHEMA;

export const TEACHER_CREATE_SCHEMA = USER_CREATE_SCHEMA;

export const TEACHER_UPDATE_SCHEMA = USER_UPDATE_SCHEMA;

export const STUDENT_CREATE_SCHEMA = USER_CREATE_SCHEMA.keys({
    class: Joi.string()
        .required(),
});

export const STUDENT_UPDATE_SCHEMA = USER_UPDATE_SCHEMA.keys({
    class: Joi.string(),
});

// --------------------------------
// RESPONSE SCHEMAS
// --------------------------------

export const USER_SCHEMA = Joi
    .object({
        type: Joi.string()
            .valid("admin", "student", "teacher")
            .required(),
        firstName: Joi.string()
            .required(),
        lastName: Joi.string()
            .required(),
        email: EMAIL_SCHEMA.required(),
    })
    .label("User");

export const ADMIN_SCHEMA = USER_SCHEMA
    .keys({
        type: Joi.string()
            .valid("admin")
            .required(),
    })
    .label("Admin");

export const CLASS_SCHEMA = Joi
    .object({
        name: Joi.string()
            .required(),
    })
    .label("Class");

export const STUDENT_SCHEMA = USER_SCHEMA
    .keys({
        type: Joi.string()
            .valid("student")
            .required(),
        class: CLASS_SCHEMA.required(),
    })
    .label("Student");

export const TEACHER_SCHEMA = USER_SCHEMA
    .keys({
        type: Joi.string()
            .valid("teacher")
            .required(),
    })
    .label("Teacher");

export const SUBJECT_SCHEMA = Joi
    .object({
        name: Joi.string()
            .required(),
        description: Joi.string()
            .allow("")
            .required(),
    })
    .label("Subject");

export const GRADE_SCHEMA = Joi
    .object({
        id: UUID_SCHEMA.required(),
        value: Joi.number()
            .min(0)
            .max(10)
            .multiple(0.25)
            .required(),
        timestamp: Joi.date()
            .max("now")
            .iso()
            .required(),
        description: Joi.string()
            .allow("")
            .required(),
        subject: SUBJECT_SCHEMA.required(),
        teacher: TEACHER_SCHEMA.required(),
    })
    .label("Grade");

export const SESSION_SCHEMA = Joi
    .object({
        id: UUID_SCHEMA.required(),
        type: Joi.string().valid("admin", "student", "teacher").required(),
        user: USER_SCHEMA.required(),
        expires: Joi.date().iso().required(),
    })
    .label("Session");

export const TEACHING_SCHEMA = Joi
    .object({
        id: UUID_SCHEMA.required(),
        teacher: TEACHER_SCHEMA.required(),
        class: CLASS_SCHEMA.required(),
        subject: SUBJECT_SCHEMA.required(),
    })
    .label("Teaching");
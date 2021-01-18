import Joi from "joi";

export const CLASS_CREATE_SCHEMA = Joi.object({
    name: Joi.string()
        .required(),
});

export const GRADE_CREATE_SCHEMA = Joi.object({
    student: Joi.string()
        .required(),
    subject: Joi.string()
        .required(),
    value: Joi.number()
        .min(0)
        .max(10)
        .multiple(0.25)
        .required(),
    timestamp: Joi.string()
        .isoDate()
        .required(),
    description: Joi.string()
        .valid("")
        .required(),
});

export const STUDENT_CREATE_SCHEMA = Joi.object({
    class: Joi.string()
        .required(),
});

export const STUDENT_UPDATE_SCHEMA = Joi.object({
    class: Joi.string(),
});

export const SUBJECT_CREATE_SCHEMA = Joi.object({
    name: Joi.string()
        .required(),
    description: Joi.string()
        .valid("")
        .required(),
});

export const TEACHING_CREATE_SCHEMA = Joi.object({
    name: Joi.string()
        .required(),
});

export const USER_CREATE_SCHEMA = Joi.object({
    type: Joi.string()
        .valid("admin", "student", "teacher")
        .required(),
    firstName: Joi.string()
        .required(),
    lastName: Joi.string()
        .required(),
    email: Joi.string()
        .email()
        .required(),
    password: Joi.string()
        .min(8)
        .required(),
});

export const USER_UPDATE_SCHEMA = Joi.object({
    firstName: Joi.string(),
    lastName: Joi.string(),
    email: Joi.string()
        .email(),
    password: Joi.string()
        .min(8),
});
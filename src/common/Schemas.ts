import Joi from "joi";

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
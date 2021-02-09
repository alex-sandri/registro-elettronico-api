import Joi from "joi";
import JoiDate from "@joi/date";
import { Config } from "./Config";

// --------------------------------
// MISC
// --------------------------------

export const EMAIL_SCHEMA = Joi.string().email();

export const PASSWORD_SCHEMA = Joi.string().min(Config.PASSWORD_MIN_LENGTH);

export const UUID_SCHEMA = Joi.string().uuid({ version: "uuidv4" });

export const DATE_SCHEMA = Joi.extend(JoiDate).date().utc().format("YYYY-MM-DD");
export const DATETIME_SCHEMA = Joi.extend(JoiDate).date().utc().format("YYYY-MM-DDTHH:mm:ss.SSSZ");

export const USER_TYPE_SCHEMA = Joi.string().valid("admin", "student", "teacher");

export const CALENDAR_ITEM_TYPE_SCHEMA = Joi.string().valid("general", "test", "event", "info", "important");

export const ABSENCE_TYPE_SCHEMA = Joi.string().valid("absence", "late", "short-delay", "early-exit");

// --------------------------------
// REQUEST SCHEMAS
// --------------------------------

export const SESSION_CREATE_SCHEMA = Joi.object({
    email: EMAIL_SCHEMA.required(),
    password: PASSWORD_SCHEMA.required(),
});

export const CLASS_CREATE_SCHEMA = Joi.object({
    name: Joi.string().required(),
});

export const GRADE_CREATE_SCHEMA = Joi.object({
    value: Joi.number()
        .min(0)
        .max(10)
        .multiple(0.25)
        .required(),
    timestamp: DATETIME_SCHEMA.max("now").required(),
    description: Joi.string().allow("").required(),
    student: EMAIL_SCHEMA.required(),
    subject: Joi.string().required(),
    teacher: EMAIL_SCHEMA.required(),
});

export const SUBJECT_CREATE_SCHEMA = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow("").required(),
});

export const SUBJECT_UPDATE_SCHEMA = Joi.object({
    name: Joi.string(),
    description: Joi.string().allow(""),
});

export const TEACHING_CREATE_SCHEMA = Joi.object({
    teacher: EMAIL_SCHEMA.required(),
    class: Joi.string().required(),
    subject: Joi.string().required(),
});

export const USER_CREATE_SCHEMA = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: EMAIL_SCHEMA.required(),
    password: PASSWORD_SCHEMA.required(),
    birthday: DATE_SCHEMA.max("now").required(),
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
    class: Joi.string().required(),
});

export const STUDENT_UPDATE_SCHEMA = USER_UPDATE_SCHEMA.keys({
    class: Joi.string(),
});

export const CALENDAR_ITEM_CREATE_SCHEMA = Joi.object({
    type: CALENDAR_ITEM_TYPE_SCHEMA.required(),
    start: DATETIME_SCHEMA.min("now").required(),
    end: DATETIME_SCHEMA.greater(Joi.ref("start")).required(),
    title: Joi.string().required(),
    content: Joi.string().required(),
    class: Joi.string().required(),
});

export const CALENDAR_ITEM_UPDATE_SCHEMA = Joi.object({
    type: CALENDAR_ITEM_TYPE_SCHEMA,
    start: DATETIME_SCHEMA.min("now"),
    end: DATETIME_SCHEMA.greater(Joi.ref("start")),
    title: Joi.string(),
    content: Joi.string(),
});

export const DEMERIT_CREATE_SCHEMA = Joi.object({
    content: Joi.string().required(),
    student: EMAIL_SCHEMA.required(),
});

export const LESSON_CREATE_SCHEMA = Joi.object({
    subject: Joi.string().required(),
    class: Joi.string().required(),
    description: Joi.string().required(),
    date: DATE_SCHEMA.max("now").required(),
    hour: Joi.number().min(1).required(),
    duration: Joi.number().min(1).max(6).required(),
});

export const LESSON_UPDATE_SCHEMA = Joi.object({
    description: Joi.string(),
    hour: Joi.number().min(1),
    duration: Joi.number().min(1).max(6),
});

export const ABSENCE_CREATE_SCHEMA = Joi.object({
    type: ABSENCE_TYPE_SCHEMA.required(),
    from: DATE_SCHEMA.max(Joi.ref("to")).required(),
    to: DATE_SCHEMA.max("now").required(),
    description: Joi.string().allow("").required(),
    student: Joi.string().required(),
});

export const ABSENCE_UPDATE_SCHEMA = Joi.object({
    justified: Joi.boolean(),
});

// --------------------------------
// RESPONSE SCHEMAS
// --------------------------------

export const USER_SCHEMA = Joi
    .object({
        type: USER_TYPE_SCHEMA.required(),
        firstName: Joi.string()
            .required(),
        lastName: Joi.string()
            .required(),
        email: EMAIL_SCHEMA.required(),
        birthday: DATE_SCHEMA.max("now").required(),
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
        type: USER_TYPE_SCHEMA.required(),
        user: USER_SCHEMA.required(),
        expires: DATETIME_SCHEMA.required(),
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

export const STUDENT_REPORT_SCHEMA = Joi
    .object({
        grades: Joi.array()
            .items(Joi.object({
                subject: Joi.string().required(),
                average: Joi.number().min(0).max(10).required(),
            }))
            .required(),
    })
    .label("Student Report");

export const CALENDAR_ITEM_SCHEMA = Joi
    .object({
        id: UUID_SCHEMA.required(),
        type: CALENDAR_ITEM_TYPE_SCHEMA.required(),
        start: DATETIME_SCHEMA.required(),
        end: DATETIME_SCHEMA.required(),
        title: Joi.string().required(),
        content: Joi.string().required(),
        author: USER_SCHEMA.required(),
        class: CLASS_SCHEMA.required(),
        created: DATETIME_SCHEMA.required(),
        lastModified: DATETIME_SCHEMA.required(),
    })
    .label("Calendar Item");

export const DEMERIT_SCHEMA = Joi
    .object({
        id: UUID_SCHEMA.required(),
        content: Joi.string().required(),
        author: USER_SCHEMA.required(),
        student: STUDENT_SCHEMA.required(),
        created: DATETIME_SCHEMA.required(),
    })
    .label("Demerit");

export const LESSON_SCHEMA = Joi
    .object({
        id: UUID_SCHEMA.required(),
        teacher: TEACHER_SCHEMA.required(),
        subject: SUBJECT_SCHEMA.required(),
        class: CLASS_SCHEMA.required(),
        description: Joi.string().required(),
        date: DATE_SCHEMA.required(),
        hour: Joi.number().min(1).required(),
        duration: Joi.number().min(1).max(6).required(),
    })
    .label("Lesson");

export const ABSENCE_SCHEMA = Joi
    .object({
        id: UUID_SCHEMA.required(),
        type: ABSENCE_TYPE_SCHEMA.required(),
        from: DATE_SCHEMA.required(),
        to: DATE_SCHEMA.required(),
        description: Joi.string().allow("").required(),
        justified: Joi.boolean().required(),
        student: STUDENT_SCHEMA.required(),
        created: DATETIME_SCHEMA.required(),
        lastModified: DATETIME_SCHEMA.required(),
    })
    .label("Absence");
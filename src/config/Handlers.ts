import { Request, ResponseToolkit } from "@hapi/hapi";
import Boom from "@hapi/boom";

import Admin from "../models/Admin";
import Student from "../models/Student";
import User from "../models/User";
import Teacher from "../models/Teacher";

export const GET_ADMIN_HANDLER = async (request: Request, h: ResponseToolkit) =>
{
    const admin = await Admin.retrieve(request.params.id);

    if (!admin)
    {
        throw Boom.notFound();
    }

    return admin.serialize();
};

export const GET_STUDENT_HANDLER = async (request: Request, h: ResponseToolkit) =>
{
    const student = await Student.retrieve(request.params.id);

    if (!student)
    {
        throw Boom.notFound();
    }

    const user = request.auth.credentials.user as User;

    if (user.data.type === "student" && student.data.email !== user.data.email)
    {
        throw Boom.forbidden();
    }

    return student.serialize();
};

export const GET_TEACHER_HANDLER = async (request: Request, h: ResponseToolkit) =>
{
    const teacher = await Teacher.retrieve(request.params.id);

    if (!teacher)
    {
        throw Boom.notFound();
    }

    return teacher.serialize();
};
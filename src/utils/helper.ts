import { AppError } from "./error.js"

export const isAppError = (error: unknown) : error is AppError => {

    return error instanceof AppError;
};
export class AppError extends Error {
    constructor(
     message: string,
    public readonly statusCode: number,

    ) {
        super(message);
        this.name = "AppError"
    }

}

export class ConflictError extends AppError{
    constructor(message: string){
        super(message , 409)
    }
}

export class UnAuthorizedError extends AppError{
    constructor(message = "Invalid Credentials" ){
        super(message , 401)
    }
}

export class NotFoundError extends AppError{
    constructor(message : string){
        super(message , 404)
    }
}
export class PersistanceError extends Error {
    constructor(message: string) {
        super(`[PERSISTANCE] ${message}`);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

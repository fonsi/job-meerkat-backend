export const errorWithPrefix = (error: Error, prefix: string): Error => {
    const newError = new Error(`${prefix} - ${error.message}`);
    newError.stack = error.stack;

    return newError;
};

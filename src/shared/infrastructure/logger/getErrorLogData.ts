export const getErrorLogData = (
    error: unknown,
    context: Record<string, unknown> = {},
): Record<string, unknown> => {
    const errorData =
        error instanceof Error
            ? {
                  errorMessage: error.message,
                  errorName: error.name,
                  errorStack: error.stack,
                  ...(error.cause
                      ? { cause: getErrorLogData(error.cause) }
                      : {}),
              }
            : typeof error === 'object' && error !== null
              ? { ...(error as Record<string, unknown>) }
              : { error: String(error) };

    return { ...errorData, ...context };
};

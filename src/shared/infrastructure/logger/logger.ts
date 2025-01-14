import { isLocal } from '../framework/serverless/isLocal';
import consoleLogger from './console/consoleLogger';
import rollbarLogger from './rollbar/rollbarLogger';

export const UNKNOWN_USER_ID = 'unknown';

interface LoggerOptions {
    userId?: string;
}

export type LoggerInitFn = (options?: LoggerOptions) => void;
export type LogErrorFn = (error: Error, data?: Record<string, unknown>) => void;
export type LogInfoFn = (
    message: string,
    data?: Record<string, unknown>,
) => void;
export type LoggerWaitFn = () => Promise<void>;
export type AddEventFn = (data: Record<string, unknown>) => void;

export interface Logger {
    init: LoggerInitFn;
    error: LogErrorFn;
    info: LogInfoFn;
    wait: LoggerWaitFn;
    event: AddEventFn;
}

export let logger: Logger;

export const initializeLogger = (userId: string = UNKNOWN_USER_ID): void => {
    logger = isLocal() ? consoleLogger : rollbarLogger;

    logger.init({
        userId,
    });
};

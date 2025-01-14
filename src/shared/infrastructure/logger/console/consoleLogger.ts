import {
    Logger,
    LogErrorFn,
    LogInfoFn,
    LoggerInitFn,
    LoggerWaitFn,
    AddEventFn,
} from '../logger';

const initLogger: LoggerInitFn = (options) => {
    console.log('[Init logger]', options);
};

const logError: LogErrorFn = (error, data?) => {
    console.group();
    console.error(`[Error] ${error.message}`);
    console.error(`[Stack] ${error.stack}`);
    if (data) {
        console.error('[Data]', data);
    }
    console.groupEnd();
};

const logInfo: LogInfoFn = (message, data?) => {
    console.group();
    console.log(`[Info] ${message}`);
    if (data) {
        console.log('[Data]', data);
    }
    console.groupEnd();
};

const wait: LoggerWaitFn = () => Promise.resolve();

const event: AddEventFn = (data?) => {
    console.log('[Event]', data);
};

const logger: Logger = {
    init: initLogger,
    error: logError,
    info: logInfo,
    wait,
    event,
};

export default logger;

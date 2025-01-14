import {
    Logger,
    LogErrorFn,
    LogInfoFn,
    LoggerInitFn,
    LoggerWaitFn,
    AddEventFn,
} from '../logger';
import rollbar from 'rollbar';

const ACCESS_TOKEN = process.env.ROLLBAR_ACCESS_TOKEN;
const ENVIRONMENT = process.env.STAGE;
const ITEMS_PER_MINUTE = 10;

let rollbarInstance: rollbar;

const initLogger: LoggerInitFn = (options) => {
    if (rollbarInstance) {
        return;
    }

    const config: rollbar.Configuration = {
        accessToken: ACCESS_TOKEN,
        captureUncaught: true,
        captureUnhandledRejections: true,
        environment: ENVIRONMENT,
        itemsPerMinute: ITEMS_PER_MINUTE,
        payload: {
            person: {
                id: options.userId,
            },
        },
    };

    rollbarInstance = rollbar.init(config);
};

const logError: LogErrorFn = (error, data = {}) => {
    rollbarInstance.error(error, data);
};

const logInfo: LogInfoFn = (message, data = {}) => {
    rollbarInstance.info(message, data);
};

const wait: LoggerWaitFn = () =>
    new Promise((resolve) => {
        rollbarInstance.wait(resolve);
    });

const event: AddEventFn = (data) => {
    rollbarInstance.captureEvent(data, 'info');
};

const logger: Logger = {
    init: initLogger,
    error: logError,
    info: logInfo,
    wait,
    event,
};

export default logger;

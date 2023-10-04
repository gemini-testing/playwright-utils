type LoggerMethod = "debug" | "info" | "log" | "warn" | "error";

export type Logger = {
    [key in LoggerMethod]: (...args: any[]) => void;
};

export const createLogger = (namespace?: string): Logger => {
    const prefix = `playwright-utils${namespace ? `(${namespace})` : ""}:`;
    const methods: Array<LoggerMethod> = ["debug", "info", "log", "warn", "error"];

    return methods.reduce((logger, method) => {
        logger[method] = (...args: any[]): void => console[method](prefix, ...args);

        return logger;
    }, {} as Logger);
};

import winston from "winston";

import Transport from "winston-transport";

import DailyRotateFile from "winston-daily-rotate-file";

const DefaultLogTransport = new DailyRotateFile({
    filename: 'logs/application/%DATE%.log',
    datePattern: 'YYYY-MM',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '90d',
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),  // timestampを出力する
        winston.format.json()
    ),
});
const AccessLogTransport = new DailyRotateFile({
    filename: 'logs/access/%DATE%.log',
    datePattern: 'YYYY-MM',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '365d',
    level: "access",
    format: winston.format.combine(
        winston.format.timestamp(),  // timestampを出力する
        winston.format.simple(),
        winston.format.printf(info => `[${info.timestamp}] ${info.message}`)
    ),
});

function LogOnly<T extends Transport>(base: T, options: LogOnlyOptions) {
    const { levelOnly, levellist } = options;
    const base_log = base.log;
    base.log = function (info: any, next: () => void) {
        if (levelOnly && levellist.indexOf(info.level) > -1) {
            base_log?.call(base, info, next);
        } else {
            next();
        }
    }
    return base;
}


interface LogOnlyOptions extends Transport.TransportStreamOptions {
    levelOnly: boolean;
    levellist: string[];
}

const logger = winston.createLogger({
    levels: {
        ...winston.config.syslog.levels,
        access: 10
    },
    transports: [
        new winston.transports.Console({
            format: winston.format.cli(),
            level: "info",
            handleExceptions: true,
        }),
        LogOnly(AccessLogTransport, {
            level: "access",
            levelOnly: true,
            levellist: ["access"],
        }),
        new winston.transports.File({
            format: winston.format.combine(
                winston.format.timestamp(),  // timestampを出力する
                winston.format.splat(),  // String interpolation splat for %d %s-style messages.
                winston.format.json()
            ),
            level: "error",
            filename: "logs/error.log"
        }),
        DefaultLogTransport
    ]
});

winston.addColors({
    access: "gray"
})

export default logger;
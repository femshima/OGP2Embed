import winston from "winston";

import Transport from "winston-transport";

import DailyRotateFile from "winston-daily-rotate-file";

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

const print = winston.format.printf((info) => {
    const log = `${info.level}: ${info.message}`;

    return info.stack
        ? `${log}\n${info.stack}`
        : log;
});

const ErrorLogTransport = new winston.transports.File({
    format: winston.format.combine(
        print,
        winston.format.timestamp(),
        winston.format.splat(),
        winston.format.json()
    ),
    level: "error",
    filename: "logs/error.log"
});

const DefaultLogTransport = new DailyRotateFile({
    filename: 'logs/application/%DATE%.log',
    datePattern: 'YYYY-MM',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '90d',
    level: "info",
    format: winston.format.combine(
        print,
        winston.format.timestamp(),
        winston.format.json()
    ),
});
const AccessLogTransport = LogOnly(
    new DailyRotateFile({
        filename: 'logs/access/%DATE%.log',
        datePattern: 'YYYY-MM',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '365d',
        level: "access",
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.simple(),
            winston.format.printf(info => `[${info.timestamp}] ${info.message}`)
        ),
    }),
    {
        level: "access",
        levelOnly: true,
        levellist: ["access"],
    }
);


const logger = winston.createLogger({
    levels: {
        ...winston.config.syslog.levels,
        access: 10
    },
    format: winston.format.combine(
        winston.format.errors({ stack: true })
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                print,
            ),
            level: process.env.NODE_ENV === "production" ? "info" : "debug",
            handleExceptions: true,
        }),
        ...process.env.NODE_ENV === "production"||true ? ([
            AccessLogTransport,
            ErrorLogTransport,
            DefaultLogTransport]
        ) : [],
    ]
});

winston.addColors({
    access: "gray"
})

export default logger;
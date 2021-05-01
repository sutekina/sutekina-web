let config;
let winston
try {
    config = require("../../config.json");
} catch(err) {
    config = require("../../ext/sample.config.json");
}

try {
    winston = require("winston");
} catch (err) {
    throw new Error("Please install winston with 'npm i winston'");
}

module.exports = {
    error: (error) => {
        if(config.debug.error_logging) console.log(`ERROR (${getLoggingDate()}): ${error}`);
    },
    mysql: (query) => {
        if(config.debug.mysql_logging) console.log(`MYSQL (${getLoggingDate()}): ${query}`);
    },
    info: (info) => {
        if(config.debug.info_logging) console.log(`INFO (${getLoggingDate()}): ${info}`);
    },
    output: (output) => {
        if(config.debug.output_logging) console.log(`OUTPUT (${getLoggingDate()}): ${output}`);
    },
    request: (request) => {
        if(config.debug.request_logging) console.log(`REQUEST (${getLoggingDate()}): ${request}`);
    }
}

const path = require('path');
const levels = require('./levels.json');
const colors = require('./colors.json');

winston.addColors(colors);

const consoleFormat = winston.format.printf(info => {
    return `[${info.timestamp}] ${info.level}${(info.status) ? ` ${info.status}` : ''}: ${info.stack || info.message}`
});

module.exports.winston = winston.createLogger({
    levels: levels,
    transports: [
        new winston.transports.Console({
            level: config.debug.logging.terminal_level,
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.timestamp({format: config.debug.logging.timestamp_format}),
                winston.format.errors({stack:true}),
                consoleFormat,
            )
        }),
        new winston.transports.File({
            level: config.debug.logging.file_level,
            json: true,
            filename: path.join(process.cwd(), `/logs/${new Date().toISOString()}.log`),
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({stack:true}),
                winston.format.json({space: 2})
            )
        })
    ]

})

getLoggingDate = () => {
    return new Date().toLocaleString('en-GB', {dateStyle: 'short', timeStyle: 'long'});
}
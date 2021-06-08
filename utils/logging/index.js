let config;
let winston;    
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

const path = require('path');
const levels = require('./levels.json');
const colors = require('./colors.json');

winston.addColors(colors);

const consoleFormat = winston.format.printf(info => {
    return `[${info.timestamp}] ${info.level}${(info.status) ? ` ${info.status}` : ''}: ${info.stack || info.message}`
});

module.exports = winston.createLogger({
    levels: levels,
    transports: [
        new winston.transports.Console({
            level: config.debug.logging.terminal_level,
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.errors({stack:true}),
                winston.format.timestamp({format: config.debug.logging.timestamp_format}),
                consoleFormat,
            )
        }),
        new winston.transports.File({
            level: config.debug.logging.file_level,
            json: true,
            filename: path.join(process.cwd(), `/logs/${new Date().toISOString()}.log`),
            format: winston.format.combine(
                winston.format.errors({stack:true}),
                winston.format.timestamp(),
                winston.format.json({space: 2})
            )
        })
    ]

});
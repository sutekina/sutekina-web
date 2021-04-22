let config;
try {
    config = require("../config.json");
} catch(err) {
    config = require("../ext/sample.config.json");
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

getLoggingDate = () => {
    return new Date().toLocaleString('en-GB', {dateStyle: 'short', timeStyle: 'long'});
}
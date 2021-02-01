let config;
try {
    config = require("../config.json");
} catch(err) {
    config = require("../ext/sample.config.json");
}
module.exports = {
    error: (error) => {
        if(config.debug.error_logging) console.log("ERROR:" + error);
    },
    mysql: (query) => {
        if(config.debug.mysql_logging) console.log("MYSQL:" + query);
    },
    info: (info) => {
        if(config.debug.info_logging) console.log("INFO:" + info);
    },
    output: (output) => {
        if(config.debug.output_logging) console.log("OUTPUT:" + output);
    },
    request: (request) => {
        if(config.debug.request_logging) console.log("REQUEST:" + request);
    }
}
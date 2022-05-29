
let request = {
    https: require("https"),
    http: require("http")
}

module.exports = (options, type = "json") => {
    return new Promise((resolve, reject) => {
        const {logging} = require('../.');

        logging.trace(`Preparing request for ${options.hostname}.`,  options);
        
        if(!options.timeout) options.timeout = 2000;

        let req = request[(options.protocol.includes("https") ? "https" : "http")].request(options, (res) => {                        
            logging.trace(`Request to ${options.hostname}.`, options);
            logging.debug(`Request to ${options.hostname}${options.path} // ${res.statusCode} ${res.statusMessage}.`);

            res.on("error", err => reject(err))
            let data = '';
            res.on('data', chunk => {
                data += chunk;
            });

            res.on('close', () => {
                try {
                    data = (type === "json") ? JSON.parse(data) : data;
                } catch (err) {
                    return res.emit("error", err);
                }
                logging.trace(`Request to ${options.hostname} closed.`, {data});
                resolve(data);
            });
        })

        req.on("error", err => reject(err))
        
        req.on("timeout", () => reject("TIMEOUT"));

        req.end();
    });
};
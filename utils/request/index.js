
let request = {
    https: require("https"),
    http: require("http")
}

module.exports = (options, type = "json") => {
    return new Promise((resolve, reject) => {
        const {logging} = require('../.');

        logging.trace(`Preparing request for ${options.hostname}.`,  options);
        
        let req = request[(options.protocol.includes("https") ? "https" : "http")].request(options, (res) => {                        
            logging.trace(`Request to ${options.hostname}.`, options);
            logging.debug(`Request to ${options.hostname}${options.path} // ${res.statusCode} ${res.statusMessage}.`);

            res.on("error", err => reject(err))
            let data = '';
            res.on('data', chunk => {
                data += chunk;
            });
    
            res.on('close', () => {
                data = (type === "json") ? JSON.parse(data) : data;
                logging.trace(`Request to ${options.hostname} closed.`, {data});
                resolve(data);
            });
        })

        req.on("error", err => reject(err))

        req.end();
    });
};
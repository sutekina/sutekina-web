const {logging} = require('../.');
module.exports = (req, res, next) => {
    res.on("finish", () => {
        logging.winston.debug(`${req.method} ${req.hostname}${req.originalUrl}`);
        logging.winston.trace(JSON.stringify({
            method: req.method,
            hostname: req.hostname,
            path: (req.baseUrl) ? req.baseUrl + req.path : req.path,
        }));
    });
    next();
}
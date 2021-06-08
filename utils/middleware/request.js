const {logging, clock} = require('../.');
module.exports = (req, res, next) => {
    const request_start = clock();
    res.on("finish", () => {
        const request_end = clock(request_start);
        logging.debug(`${req.method} ${req.hostname}${req.originalUrl} // ${request_end}ms`, {
            request: {
                method: req.method,
                protocol: req.protocol,
                status: res.statusCode,
                hostname: req.hostname,
                path: (req.baseUrl) ? req.baseUrl + req.path : req.path,
                query: req.query
            },
            status: res.statusCode
        });
        logging.trace(`${req.method} / IP: (${req.headers['x-forwarded-for'] || req.connection.remoteAddress}), URL: ${req.hostname}${req.originalUrl} // ${request_end}ms`, {session: req.session, headers: req.headers, status: res.statusCode});
    });
    next();
}
const {logging, errorHandling} = require("./utils/");
require("./init").then(([modules, config, app]) => {
    module.exports = {modules, config, app};
    const middleware = require("./utils/middleware");
    const routers = require("./routers");
    try {
        // Executes all util middleware as middleware
        middleware.map(m => app.use(m));

        app.use(modules["morgan"]('dev'));
        app.use('/public', modules["express"].static('public'));

        app.get("/", (req,res,next) => {
            res.redirect(301, '/home');
        });
        // Maps the routers and then adds them as middleware with their url and export.
        routers.map(r => app.use(r.url, r.export));
    // If an error occurs within the try block above it doesn't crash the app but rather catches it, I should most likely make a log for all errors that come from here.
    } catch (err) {
        app.use((req, res, next) => next(err));
    }
    // No other request was successful, throwing 404.
    app.use((req, res, next) => next(new errorHandling.SutekinaError({status:404})));
    // Handle all errors and requests with a next() parameter.
    app.use((err, req, res, next) => {
        // set body to err to add stack trace
        body = {
            status: err.status || err.statusCode || 500,
            message: err.message || err
        };
        logging.winston[err.level || "error"](body.message, {status: body.status});
        
        res.statusMessage = errorHandling.ErrorStatusCodes[body.status];
        // req.data has to be redefined because if the app crashes within the initialization then there would be even bigger issues.
        req.data = {
            config: config,
            page: {
                redir: req.data.page.redir || req.query.redir || '/',
                title: `${body.status} ${res.statusMessage}`,
                type: "error",
                url: req.data.page.url || req.path
            },
            user: {
                id: req.data.user.id || null,
                name: req.data.user.name || null
            },
            error: body
        };
        res.render('index', req.data);
    });
}); 

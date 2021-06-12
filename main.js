const {logging, errorHandling} = require("./utils/");
require("./init").then(([modules, config, app]) => {
    module.exports = {modules, config, app};
    const middleware = require("./utils/middleware");
    const routers = require("./routers");
    const {express, mysql2} = modules;
    
    try {
        middleware.map(m => app.use(m));
        app.use('/public', express.static('public'));
        app.get("/", (req,res,next) => {
            res.redirect(301, '/home');
        });
        routers.map(r => app.use(r.url, r.export));
    } catch (err) {
        err.level = err.level || "error";
        app.use((req, res, next) => next(err));
    }

    app.use((req, res, next) => next(new errorHandling.SutekinaError({status:404, level:"debug"})));

    app.use((err, req, res, next) => {
        if(!err.message) err = new errorHandling.SutekinaError({message: err});
        if(!err.status) err.status = err.statusCode || err.code || 500;
        logging[err.level || "error"](err, {status: err.status});
        
        res.statusMessage = errorHandling.ErrorStatusCodes[err.status];
        req.data = {
            config: config,
            page: {
                redir: req.data.page.redir || req.query.redir || '/',
                title: `${err.status}`,
                type: "error",
                url: req.data.page.url || req.path
            },
            user: {
                id: req.data.user.id || null,
                name: req.data.user.name || null
            },
            error: err
        };
        res.status(err.status).render('index', req.data);
    });

    process.on('SIGINT', () => {
        logging.fatal("SIGINT caught, killing sutekina-web.");
        logging.info('Closing express server.')
        app.server.close();
        app.server.once('close', () => {
            logging.info('Successfully closed express server, shutting down MYSQL connection.');
            mysql2.pool.end((err) => {
                (err) ? logging.error(err) : logging.info('Successfully ended MYSQL connection pool, exiting process.');
                process.exit(0);
            });
            setTimeout(() => {logging.error("MYSQL took too long to end pool, forcing process exit."); process.exit(0)}, 10000);
        });
    });
}).catch(err => {
    logging.fatal(err);
    process.exit(5);
});
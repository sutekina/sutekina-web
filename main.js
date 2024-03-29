const { addColors } = require("winston/lib/winston/config");
const {logging, errorHandling, mysql} = require("./utils/");
require("./init").then(([modules, config, app]) => {
    module.exports = {modules, config, app};
    const middleware = require("./utils/middleware");
    const routers = require("./routers");
    const {express, mysql2} = modules;

    try {
        middleware.map(m => app.use(m));
        app.use('/public', express.static('public'));
        // 301 : permanent redirect, the urls don't change or at least shouldn't and therefore the browser can cache.
        // 307 : temporary redirects, the urls are bound to change therefore the browser should request the old url first.
        app.get("/", (req,res,next) => {
            res.redirect(301, '/home');
        });
        app.get("/u/*", (req,res,next) => {
            res.redirect(301, req.originalUrl.replace('u', 'users'));
        });
        app.get("/b/*", (req,res,next) => {
            res.redirect(301, req.originalUrl.replace('b', 'beatmaps'));
        });
        app.get("/s/*", (req,res,next) => {
            res.redirect(301, req.originalUrl.replace('s', 'beatmapsets'));
        });
        app.get("/connect", (req,res,next) => {
            req.data.page.title = "connect";
            req.data.page.type = "connect";
            res.render('index', req.data);    
        });
        app.get("/search", (req,res,next) => {
            req.data.page.title = "search";
            req.data.page.type = "search";
            res.render('index', req.data);    
        });
        app.get("/discord", (req,res,next) => {
            res.redirect(307, config.domains.discord);
        });
        routers.map(r => app.use(r.url, r.export));
    } catch (err) {
        err.level = err.level || "error";
        app.use((req, res, next) => next(err));
    }

    app.use((req, res, next) => next(new errorHandling.SutekinaError({status:404, level:"debug"})));

    app.use((err, req, res, next) => {
        err = err.message ? err : new errorHandling.SutekinaError({message: err});
        err.status = err.status ? err.status : err.statusCode || err.code || 500;

        logging[err.level || "error"](err.message, err);
        
        res.statusMessage = errorHandling.ErrorStatusCodes[err.status] || errorHandling.ErrorStatusCodes[500];
        req.data = {
            config: config,
            page: {
                redir: req.query.redir || '/',
                title: `${err.status}`,
                type: "error",
                url: req.path
            },
            user: req.data && req.data.user && req.data.user.id ? req.data.user : {
                id: null,
                name: null
            },
            error: err
        };
        res.status(err.status).render('index', req.data);
    });
    
    let connections = [];
    // every one minute, this should be good cause it should just log connections that could be stuck.
    setInterval(() => app.server.getConnections(
        (err, connections) => (connections > 0) ? logging.debug(`${connections} connections currently open.`) : ""
    ), 60000);

    app.server.on('connection', connection => {
        connections.push(connection);
        connection.on('close', () => connections = connections.filter(curr => curr !== connection));
    });

    process.on('SIGINT', () => {
        logging.fatal("SIGINT caught, killing sutekina-web.");
        logging.info('Closing express server and closing all open connections.')
        app.server.close();
        app.server.once('close', () => {
            logging.info('Successfully closed express server, shutting down MYSQL connection.');
            mysql2.pool.end((err) => {
                (err) ? logging.error(err) : logging.info('Successfully closed MYSQL connection pool, exiting process.');
                process.exit(0);
            });
            setTimeout(() => {logging.error("MYSQL took too long to close pool, forcing process exit."); process.exit(0)}, 10000);
        });

        setTimeout(() => {
            logging.info('Could not close connections in time, forcefully shutting down.');
            mysql2.pool.end((err) => {
                (err) ? logging.error(err) : logging.info('Successfully closed MYSQL connection pool, exiting process.');
                process.exit(1);
            });
            setTimeout(() => {logging.error("MYSQL took too long to close pool, forcing process exit."); process.exit(1)}, 10000);
        }, 10000);
    
        connections.forEach(curr => curr.end());
        setTimeout(() => connections.forEach(curr => curr.destroy()), 5000);
    });
}).catch(err => {
    logging.fatal(err.message, err);
    process.exit(5);
});
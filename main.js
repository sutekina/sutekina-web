const log = require("./utils/log");

require("./init").then(([modules, config, app]) => {
    module.exports = {modules, config, app};
    try {
        app.get("/avatar", (req, res, next) => {
            req.data.type = "index";
            req.data.page_title = "Startseite";
            res.render('pages/index', req.data);
        });
    } catch (err) {
        app.use((req, res, next) => next(err));
    }
    app.use((req, res, next) => next(new modules["utility"].errorHandling.SutekinaStatusError(404)));

    app.use((err, req, res, next) => {
        body = {
            code: err.status || err.statusCode || 500,
            message: err.message || err
        };
        
        log.error(body.message);

        res.statusMessage = modules["utility"].errorHandling.ErrorStatusCodes[body.code];
        req.data = {
            page: {
                redir: req.query.redir || '/',
                title: `${body.code} ${res.statusMessage} `,
                url: req.path
            },
            user: {
                id: null,
                name: null
            }
        };
        res.status(body.code).send(body);
    });
}); 

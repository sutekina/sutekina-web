const log = require("./utils/log");

require("./init").then(([modules, config, app]) => {
    module.exports = {modules, config, app};
    try {
        app.get("/", (req,res,next) => {
            res.redirect("/home")
        });
        app.get("/home", (req, res, next) => {
            req.data.page.title = "home"
            res.render('index', req.data)
        });
        app.get("/home/account/edit", (req, res, next) => {
            req.data.type = "home";
            req.data.page.title = "settings";
            res.render('index', req.data);
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
                type: "error",
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

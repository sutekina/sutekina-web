const {modules, config, app} = require('../main');
const Router = modules['express'].Router();

Router.get("/", (req, res, next) => {
    req.data.page.title = "home";
    res.render('index', req.data);
});
Router.get("/account/edit", (req, res, next) => {
    req.data.type = "home";
    req.data.page.title = "settings";
    res.render('index', req.data);
});

module.exports = Router;
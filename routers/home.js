const {modules, config, app} = require('../main');
const {logging, errorHandling} = require('../utils');
const Router = modules['express'].Router();

Router.get("/", (req, res, next) => {
    req.data.page.title = "home";
    res.render('index', req.data);
});
Router.get("/account/edit", (req, res, next) => {
    // forward this from /home/account/edit to /account/edit TODO
    req.data.type = "home";
    req.data.page.title = "settings";
    res.render('index', req.data);
});

module.exports = Router;
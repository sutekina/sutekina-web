const {modules, config, app} = require('../main');
const {logging, errorHandling} = require('../utils');
const router = modules['express'].Router();

router.get("/", (req, res, next) => {
    req.data.page.title = "home";
    res.render('index', req.data);
});

router.get("/account/edit", (req, res, next) => {
    res.redirect(301, "/account/settings");
});

module.exports = router;
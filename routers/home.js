const {modules, config, app} = require('../main');
const {logging, errorHandling} = require('../utils');
const router = modules['express'].Router();

router.get("/", (req, res, next) => {
    req.data.page.title = "home";
    res.render('index', req.data);
});

router.get("/account/edit", (req, res, next) => {
    // forward this from /home/account/edit to /account/edit TODO
    req.data.page.type = "home";
    req.data.page.title = "settings";
    res.render('index', req.data);
});

module.exports = router;
const {modules, config, app} = require('../main');
const {logging, errorHandling} = require('../utils');
const router = modules['express'].Router();

router.get("/:user", (req, res, next) => {
    req.data.page.title = `${req.params.user}`;
    req.data.page.type = "users";
    req.data.user = req.params.user;
    res.render('index', req.data);
});

module.exports = router;
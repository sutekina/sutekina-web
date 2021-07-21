const {modules, config, app} = require('../main');
const {logging, errorHandling} = require('../utils');
const router = modules['express'].Router();

router.get("/", (req, res, next) => {
    req.data.page.title = `rules`;
    req.data.page.type = "rules";
    res.render('index', req.data);
});

module.exports = router;
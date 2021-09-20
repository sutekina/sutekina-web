const {modules, config, app} = require('../main');
const {logging, errorHandling} = require('../utils');
const router = modules['express'].Router();

router.get("/", (req, res, next) => {
    req.data.page.title = `clans`;
    req.data.page.type = "clanslist";
    res.render('index', req.data);
});

router.get("/:clan", (req, res, next) => {
    req.data.page.title = `${req.params.clan}`;
    req.data.page.type = "clans";
    res.render('index', req.data);
});

module.exports = router;
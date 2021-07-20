const {modules, config, app} = require('../main');
const {logging, errorHandling} = require('../utils');
const router = modules['express'].Router();

router.get("/", (req, res, next) => {
    next({code: 501, message: "Not Implemented", level:"debug"});
});

module.exports = router;
const {modules, config, app} = require('../main');
const {logging, errorHandling} = require('../utils');
const router = modules['express'].Router();

router.get("/:user", async (req, res, next) => {
    req.data.page.type = "users";
    let user = (await getUser(req.params.user, "id"))[0];
    user = user ? user : (await getUser(req.params.user.toLowerCase(), "safe_name"))[0]; 
    if(!user) return next(new errorHandling.SutekinaError({message: "Not Found", status: 404, level: "debug"}));
    req.data.page.title = user.name;
    req.data.user = user.id;
    res.render('index', req.data);
});

module.exports = router;

let getUser = (id, filter = "safe_name" | "id")  => {
    return new Promise((resolve, reject) => {
        let query = `SELECT id, name FROM users WHERE ${filter} = ?`;
        modules["mysql2"].pool.execute(query, [id], (error, result) => {
            logging.trace(query);
            if(error) return reject(new errorHandling.SutekinaError({message:error.message, status:500, level:"error"}));
            return resolve(result);
        });
    });
}

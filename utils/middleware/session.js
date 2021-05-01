const {modules, config, app} = require('../../main');
const {logging, errorHandling} = require('../.');
module.exports = (req, res, next) => {
    if(req.session.name) {
        query = `SELECT * FROM users WHERE safe_name = ?`;
        modules["mysql"].connection.execute(query, [req.session.name], (error, result) => {
                logging.winston.trace(query)
                if(error) return router.next(new errorHandling.SutekinaError({message:error.message, status:500, level:"error"}));
                if(!result[0]) req.session.destroy((err) => {
                    if(err) return next(new errorHandling.SutekinaError({message:err.message, status:500, level:"error"}));
                    return res.redirect(req.data.page.redir);
                });
                req.data.user.id = result[0].id;
                req.data.user.name = result[0].name;
                next();
            }
        );
    } else {
        next();
    }
}
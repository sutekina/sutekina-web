const {modules} = require('../../main');
const {logging, errorHandling, mysql} = require('../.');
const pool = modules["mysql2"].pool;
module.exports = (req, res, next) => {
    if(req.session.user_id && !(req.baseUrl ? req.baseUrl + req.path : req.path).startsWith("/public")) {
        query = `SELECT * FROM users WHERE id = ?`;
        mysql(pool, query, [req.session.user_id])
            .then(({results}) => {
                console.log()
                if(!results[0]) req.session.destroy((err) => {
                    if(err) return next(new errorHandling.SutekinaError({message:err.message, status:500, level:"error"}));
                    return res.redirect(req.data.page.redir);
                });
                req.data.user.id = results[0].id;
                req.data.user.name = results[0].name;
                req.data.user.safe_name = results[0].safe_name;
                req.data.user.country = results[0].country;
                req.data.user.email = results[0].email;
                req.data.user.priv = results[0].priv;
                mysql(pool, `UPDATE users SET latest_activity = ? WHERE id = ?`, [new Date().getTime() / 1000, req.data.user.id])
                    .then(() => next())
                    .catch(error => next(new errorHandling.SutekinaError({message:error.message, status:500, level:"error"})));
            })
            .catch(error => next(new errorHandling.SutekinaError({message:error.message, status:500, level:"error"})));
    } else {
        next();
    }
}
const {modules} = require('../../main');
const {logging, errorHandling, mysql} = require('../.');
module.exports = (req, res, next) => {
    if(req.session.user_id) {
        query = `SELECT * FROM users WHERE id = ?`;
        mysql(modules["mysql2"].pool, query, [req.session.user_id])
            .then(({result}) => {
                console.log()
                if(!result[0]) req.session.destroy((err) => {
                    if(err) return next(new errorHandling.SutekinaError({message:err.message, status:500, level:"error"}));
                    return res.redirect(req.data.page.redir);
                });
                req.data.user.id = result[0].id;
                req.data.user.name = result[0].name;
                req.data.user.safe_name = result[0].safe_name;
                req.data.user.country = result[0].country;
                req.data.user.email = result[0].email;
                req.data.user.priv = result[0].priv;
                next();
            })
            .catch(error => next(new errorHandling.SutekinaError({message:error.message, status:500, level:"error"})));
    } else {
        next();
    }
}
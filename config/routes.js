exports.index = function(req, res) {
    res.render('home/index.jade');
};

exports.auth = function(req, res) {
    req.session.user_id = req.body.username;
    res.redirect('/auth');
};

exports.auth_new = function(req, res) {

};
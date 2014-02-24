var express = require('express'),
  mongoose = require('mongoose'),
  fs = require('fs-extra'),
  config = require('./config/config'),
  routes = require('./config/routes'),
  models = require('./app/models/user'),
  im = require('imagemagick');

function mongooseConnection() {
    mongoose.connect(config.db);
};
mongooseConnection();
var db = mongoose.connection;
db.on('error', function () {
  throw new Error('unable to connect to database at ' + config.db);
});
db.on('connected', function() {
    console.log('Database connection established');
    app.listen(config.port);
    console.log('Server started');
});
db.on('disconnected', function() {
    mongooseConnection();
});

var app = express();

models.defineModels(mongoose, function() {
    app.User = User = mongoose.model('User');
    app.Images = Images = mongoose.model('Images');
    app.Collections = Collections = mongoose.model('Collections');
});

require('./config/express')(app, config);
//require('./config/routes')(app);

function loadUser(req, res, next) {
    if (req.session.user_id) {
        User.findById(req.session.user_id, function(err, user) {
            if (user) {
                req.currentUser = user;
                next();
            } else {
                res.redirect('/');
            }
        });
    } else {
        res.redirect('/');
    }
};

function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
};

function guid() {
    return s4() + s4() + s4();
};

app.get('/', function(req, res) {
    var message = '';
    if (req.session.messages) {
        message = req.session.messages
        delete req.session.messages;
    };
    res.render('home/index.jade', {user: req.session.user_id, message: message});
});

app.get('/dashboard', loadUser, function(req, res) {
    User.findById(req.session.user_id, function(err, user) {
        res.render('home/dashboard', {user: req.currentUser, collections: user.collections});
    });
});

app.post('/auth', function(req, res) {
    User.findOne({email: req.body.email}, function(err, user) {
        if (user && user.authenticate(req.body.password)) {
            req.session.user_id = user.id;
            res.redirect('/dashboard');
        } else {
            req.session.messages = 'Incorrect username or password';
            res.redirect('/');
        }
    });
});

app.get('/auth/new', function(req, res) {
    var message = '';
    if (req.session.messages) {
        message = req.session.messages;
        delete req.session.messages;
    }
    res.render('users/newUser.jade', {message: message});
});

app.post('/auth/new', function(req, res) {
    var newUser = new User({ email: req.body.email, password: req.body.password, name: req.body.username });
    newUser.save(function(err) {
        if (err) {
            req.session.messages = 'User with such email already exists';
            res.redirect('/auth/new');
        } else {
            req.session.user_id = newUser.id;
            fs.mkdir('./images/'+newUser.id, function(err) {
                if (err) {
                    console.log('Image dir create error ' + err.message);
                }
            });
            res.redirect('/dashboard');
        }
    });
});

app.del('/logout', loadUser, function(req, res) {
    if (req.session) {
        req.session.destroy(function() {});
    }
    res.redirect('/');
});


app.get('/collection/:method/:collection', function(req, res) {
    User.findById(req.session.user_id, function(err, user) {
        if (req.params.method == 'new') {
            user.collections.push({name: req.params.collection});
        } else if(req.params.method == 'del') {
            user.collections.id(req.params.collection).remove();
        } else if (req.params.method == 'ren') {
            user.collections.id(req.params.collection).name = req.query.newName;
        }
        user.save(function(err) {
            if (err) {
                console.log('Error ' + err.message);
            } else {
                if (req.params.method == 'del') {
                    var dirPath = __dirname + '/images/' + req.session.user_id + '/' + req.params.collection;
                    fs.exists(dirPath, function(exists) {
                        if(exists) {
                            fs.remove(dirPath, function(err) {
                                if (err) console.log("Error directory deleting: " + err.message);
                            });
                        }
                    });
                }
                if (req.params.method == 'ren') {
                    res.send('renamed');
                    return;
                }
                res.render('dashboard/collections.jade', {user: req.currentUser, collections: user.collections});
            }
        });
    });
});


app.get('/images/:collName', function(req, res) {
    User.findById(req.session.user_id, function(err, user) {
        res.render('dashboard/images.jade', {images: user.collections.id(req.params.collName).images});
    });
});

app.post('/image/new', function(req, res) {

    fs.readFile(req.files.image.path, function (err, data) {
        var uuid = guid(),
            dirPath = __dirname + '/images/' + req.session.user_id + '/' + req.body.collectionId,
            dbPath = 'http://yo.toss.od/images/' + req.session.user_id + '/' + req.body.collectionId + '/' + uuid,
            newPath = dirPath + '/' + uuid;

        fs.exists(dirPath, function(exists) {
            if (!exists) {
                createDir();
            } else {
                write();
            }
        })

        function createDir() {
            fs.mkdir(dirPath, function(err) {
                if (err) {
                    console.log('Image dir create error ' + err.message);
                    res.redirect('/auth');
                } else {
                    write();
                }
            });
        }

        function write() {
            fs.writeFile(newPath, data, function (err) {
                if (err) {
                    console.log('Error ' + err.message);
                    res.redirect('/auth');
                } else {
                    User.findById(req.session.user_id, function(err, user) {
                        var newImage = new Images();

                        newImage.url = dbPath;
                        newImage.name = req.files.image.name;
                        newImage.uuid = uuid;
                        user.collections.id(req.body.collectionId).images.push(newImage);
                        user.save(function(err, userid) {
                            if (err) {
                                console.log('Error saving image to db' + err.message);
                            } else {
                                res.render('dashboard/images.jade', {image: user.collections.id(req.body.collectionId).images.id(newImage._id)});
                            }
                        });
                    })
                }
            });

/*            im.resize({
                srcData: fs.readFileSync('kittens.jpg', 'binary'),
                width:   256
            }, function(err, stdout, stderr){
                if (err) throw err
                fs.writeFileSync('kittens-resized.jpg', stdout, 'binary');
                console.log('resized kittens.jpg to fit within 256x256px')
            });*/


        }
    });
});

app.post('/image/del/:collId', function(req, res) {

    User.findById(req.session.user_id, function(err, user) {
        if (err) {
            console.log('Cant find user ' + err.message);
        } else {
            var imgUuid = user.collections.id(req.params.collId).images.id(req.body.imgId).uuid;
            user.collections.id(req.params.collId).images.id(req.body.imgId).remove();
            user.save(function(err) {
                if (err) {
                    console.log('Error ' + err.message);
                } else {
                    fs.unlink(__dirname + '/images/' + req.session.user_id + '/' + req.params.collId + '/' + imgUuid, function(err) {
                        if (err) {
                            console.log('Image deleting error ' + err.message);
                        } else {
                            res.send('deleted');
                        }
                    });
                }
            })
        }
    });

});

var mongoose = require('mongoose'),
    crypto = require('crypto');

var Schema = mongoose.Schema;

function defineModels(mongoose, fn) {
    /**
     * Model: Images
     */
    ImagesSchema = new Schema({
        'url': String,
        'name': String,
        'uuid': String
    });
    /**
     *
     * Model: Collection
     */
    CollectionsSchema = new Schema({
        'name': String,
        images: [ImagesSchema]
    });

    /**
     * Model: User
     */
    function validatePresenceOf(value) {
        return value && value.length;
    }

    UserSchema = new Schema({
        'email': { type: String, validate: [validatePresenceOf, 'an email is required'], index: { unique: true } },
        'name': String,
        'hashed_password': String,
        'salt': String,
        collections: [CollectionsSchema]
    });

    UserSchema.virtual('id')
        .get(function() {
            return this._id.toHexString();
        });

    UserSchema.virtual('password')
        .set(function(password) {
            this._password = password;
            this.salt = this.makeSalt();
            this.hashed_password = this.encryptPassword(password);
        })
        .get(function() { return this._password; });

    UserSchema.method('authenticate', function(plainText) {
        return this.encryptPassword(plainText) === this.hashed_password;
    });

    UserSchema.method('makeSalt', function() {
        return Math.round((new Date().valueOf() * Math.random())) + '';
    });

    UserSchema.method('encryptPassword', function(password) {
        return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
    });
/*

    UserSchema.pre('save', function(next) {
        if (!validatePresenceOf(this.password)) {
            next(new Error('Invalid password'));
        } else {
            next();
        }
    });
*/



    mongoose.model('User', UserSchema);
    mongoose.model('Collections', CollectionsSchema);
    mongoose.model('Images', ImagesSchema);

    fn();
};

exports.defineModels = defineModels;

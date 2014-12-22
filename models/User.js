/**
 * Created by André on 13/10/2014.
 */

var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

var user = mongoose.Schema({
    username: {type: String, index: true},
    email: {type: String, index: true},

    dados_pessoais: {
        nome: {
            primeiro: String,
            ultimo: String
        },
        morada: {
            rua: String,
            cidade: String,
            distrito: String
        }

    },

    rotas_favoritas: [{ type: [mongoose.Schema.Types.ObjectId], ref: 'Rota'}],

    auth: {
        facebook: String,
        twitter: String,
        google: String,
        password: String
    }

});

user.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.auth.password);
};

module.exports = mongoose.model('User', user, 'users');
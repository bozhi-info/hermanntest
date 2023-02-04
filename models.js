const {default:mongoose} = require('mongoose');
const bcrypt = require('bcryptjs');
let MoviesSchema = mongoose.Schema({
    Title: {type: String, require: true},
    Description: {type: String, require:true},
    Genre: {
        Name: String,
    Description: String
    },
    Director: {
        Name: String,
        Bio: String,
        Birthyear: Date,
        Deathyear: Date
    },
    Actor: [String],
    ImagePath: String,
    Feature: Boolean
});
let UsersSchema = mongoose.Schema({
    Username: {type:String, required:true},
    Password: {type:String, require:true},
    Email: {type:String, require:true},
    Birthday: Date,
    FavoriteMovies: [{type: mongoose.Schema.Types.ObjectId, ref:'Movie'}]
});
UsersSchema.statics.hashPassword = (password) => {
    return bcrypt.hashSync(password, 10);
};
UsersSchema.methods.validatePassword = function(password) {
    return bcrypt.compareSync(password, this.Password);
};
let Movie = mongoose.model('movies', MoviesSchema);
let User = mongoose.model('users', UsersSchema);

module.exports.Movie = Movie;
module.exports.User = User;



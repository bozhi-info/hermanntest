 const express = require("express");
const bodyParser = require("body-parser");
uuid = require("uuid");
const morgan = require("morgan");
const mongoose = require("mongoose");

const Models = require("./models.js");
const Movies = Models.Movie;
const Users = Models.User;
const Genres = Models.Genre;
const Directors = Models.Director; 
require("dotenv").config();

mongoose.set("strictQuery", true);

//connect to mongoose
mongoose.connect(`mongodb+srv://adexbam:${process.env.Password}@myflixdb.jbnef1n.mongodb.net/?retryWrites=true&w=majority`, 
{ useNewUrlParser: true, useUnifiedTopology: true });

const app = express();
app.use(bodyParser.json()); //Parse JSON bodies
app.use(express.static("public")); //middleware for serving static files
app.use(morgan("common")); //middleware for logging requests
app.use(bodyParser.urlencoded({ extended:true })); //Parse URL-encoded bodies
//Import <cors> - Middleware for controlling which domains have access
const cors = require ("cors");
let allowedOrigins = [
  "http://localhost:8080",
  "http://localhost:1234",
  "http://localhost:4200",
  "https://movies-couch-api-git-main-herra17.vercel.app/",
  "https://movies-couch-api-herra17.vercel.app/",
  "https://movies-couch-deqgo72g2-herra17.vercel.app/"
];
// check if the domain where the request came from is allowed
app.use(
  cors({
    origin: (origin, callback) => {
      if(!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin === -1)) {
        let message =
        "The CORS policy for this application doesn't allow access from origin" + origin;
        return callback(new Error(message), false); 
      }
      return callback(null, true);
    },
  }));
// import <express-validator>- Middleware for validating methods on the backend
const {check, validationResult } = require("express-validator");

// Run passport file where strategies are implemented
const passport = require ("passport");
require("./passport");
require("./auth")(app);

// get requests- default text response
app.get("/", (req, res) => {
    res.send("Welcome to Movies-couch!");
});

// return JSON object when at /movies
app.get("/movies", passport.authenticate('jwt', {session: false}), 
(req, res) => {
    Movies.find()
    .then((movies) => {
      res.status(201).json(movies);
    })
    .catch((error) => {
      console.error();
      res.status(404).send("Error: " + error);
    });
  });

// get JSON movie info when looking for specific title
app.get("/movies/:title",  passport.authenticate('jwt', {session: false}), 
(req, res) => {
  Movies.findOne({Title:  req.params.title})
    .then((movie) => {
      res.json(movie);
    })
    .catch((error) => {
      console.error();
      res.status(404).send("Error: " + error);
    });
});

// genre JSON genre info when looking for specific genre
app.get("/movies/genre/:name",  passport.authenticate('jwt', {session: false}), 
(req, res) => {
  console.log(req.params);
  Movies.findOne({"Genre.Name": req.params.name}) 
    .then((movies) => {
      console.log(movies);
      res.json(movies.Genre);
    }) 
    .catch((error) => {
      console.error(error);
      res.status(404).send("Error: " + error);
    });
  });

  
// get info on Director when looking for specific Director
app.get("/movies/director/:name/",  passport.authenticate('jwt', {session: false}), 
(req, res) => {
  Movies.findOne({"Director.Name": req.params.name }) 
    .then((movies) => {
      res.json(movies.Director);
    })
    .catch((error) => {
      console.error(error);
      res.status(404).send("Error: " + error);
    }); 
  });


//  GET-all users
app.get("/users",  passport.authenticate('jwt', {session: false}), 
(req,res) => {
    Users.find().then((users) => {
        res.status(201).json(users);
    })
    .catch((error) => {
        console.error(error);
        res.status(404).send("Error: "+ error);
    });
}); 

// --GET one user
app.get("/users/:Username",  passport.authenticate('jwt', {session: false}), 
(req,res) => {
    Users.findOne({Username: req.params.Username })
    .then((user) => {res.json(user);
    })
    .catch((error) => { 
      console.error(error);
      res.status(404).send("Error: "+ error);
    });
});

// --FindOne & Update - allow users to update their user info
app.put("/users/:Username",  passport.authenticate('jwt', {session: false}), 
(req, res) => {
    Users.findOneAndUpdate({ Username: req.params.Username},
    {$set:{
        Username: req.body.Username,
        Password: req.body.Password,
        Email: req.body.Email,
        Birthday: req.body.Birthday
    }
    },
    { new:true }, //This line makes sure that the updated document is returned
    (err, updatedUser) => {
        if(err) {
            console.error(err);
            res.status(404).send("Error: "+ err);
        } else {
            res.json(updatedUser);
        }
    });
}); 


   // -- POST
app.post("/users", 
  [
    check("Username", "Username is required").isLength({min:5}),
    check("Username", "Username contains non alphanumeric characters - not allowed").isAlphanumeric(),
    check("Password", "Password is required").not().isEmpty(),
    check("Email", "Email does not appear to be valid").isEmail()
    ],  (req,res) => {
    // check the validation object  for errors 
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
    return res.status(422).json({ errors : errors.array() });
  } 
  let hashedPassword = Users.hashPassword(req.body.Password);
    Users.findOne({Username: req.body.Username}) //search within request if User already exists
    .then((user) =>{
    if (user) {
        return res.status(400).send(req.body.Username+ "already exists");
    }  else {
        Users.create({
            Username: req.body.Username,
            Password: hashedPassword, 
            Email: req.body.Email,
            Birthday: req.body.Birthday
        })
        .then((user) => {res.status(201).json(user) })
        .catch((error) => {
            console.error(error);
            res.status(404).send("Error: "+ error);
            })
        }  
    })
    .catch((error) => {
      console.error(error);
            res.status(404).send("Error: "+ error);
    })
});

// --POST a movie to user Favorite Movies
app.post("/users/:Username/movies/:MovieID",  passport.authenticate('jwt', {session: false}), 
(req,res) => {
    Users.findOneAndUpdate({ Username: req.params.Username}, {$push:{ FavoriteMovies: req.params.MovieID} 
    },
    {new:true}, //This line makes sure that the updated document is returned
    (error, updatedUser) => {
        if(error) {
            console.error(error);
            res.status(404).send("Error: "+ error);
        } else {
            res.json(updatedUser)
        }
    });
});

// --DELETE remove a movie from Favorite Movies
app.delete("/users/:Username/movies/:MovieID",  passport.authenticate('jwt', {session: false}), 
(req,res) => {
    Users.findOneAndUpdate({ Username: req.params.Username},
      {$pull:{ FavoriteMovies: req.params.MovieID} },
    {new:true}, //This line makes sure that the updated document is returned
    (error, updatedUser) => {
        if(error) {
            console.error(error);
            res.status(404).send("Error: "+ error);
        } else {
            res.json(updatedUser)
        }
    });
});

// --DELETE user by username- allow user to deregister
app.delete("/users/:Username",  passport.authenticate('jwt', {session: false}), 
(req,res) => {
  Users.findOneAndRemove({ Username: req.params.Username})
  .then((user) => {
    if(!user) {
      res.status(400).send(req.params.Username + "was not found");
    } else { res.status(200).send(req.params.Username + "was deleted!");
   }
  })
  .catch((error) => {
    console.error(error);
    res.status(500).send("Error: "+ error);
  });
});



//error handling
app.use((err, req, res, next) =>{
console.error(err.stack);
res.status(500).send("Something broke!");
});
//listen for request
const port = process.env.Port || 8080;
app.listen(port, '0.0.0.0', () => {  
    console.log("Your app is listening on Port " + port ) 
  });
 
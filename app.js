require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const _ = require("lodash");
const session = require("express-session");
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const favicon = require('express-favicon');
const findOrCreate = require("mongoose-findorcreate");
var googleid;
const homeStartingContent = "The Japanese have a tradition of starting something new when they hit sixty years old. It is called kanreki. There is a special costume to celebrate the day, and a sense that you can have a fresh start in life. They ask themselves, what have I done in my past sixty years that I can build upon, what do I want to let go of, and what new things can I start?.Its so important to experience  new adventures in our lives and everything we do should belong to us . This platform provides you your space and cherish your thoughts and presence . Believe in yourself and create your domain in which you will grow everyday."
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent = "Thank You so much for visiting BEEBASH. All the suggestions and creative ideas to make this site more useful and functional are dearly welcomed. For all the suggestions and queries we can be contacted at various platforms as linked below. Also follow the social media handles to be updated on all the recent activities";

const app = express();


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(favicon(__dirname + '/favicon.ico'));

app.use(session({
  secret: 'keyboardkopkdmfimkcvjfkkkkkkkkkkkkkkkkkkkkirrrrrrrrrrrrrmpssssoefkls',
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://admin-gunjan:wcahniadto45@cluster01-yny2z.mongodb.net/blogDB",{useNewUrlParser: true, useUnifiedTopology: true})
mongoose.set("useCreateIndex",true);
mongoose.set('useFindAndModify', false);

const postSchema = {
 title: String,
 author: String,
 des: String,
 date: String,
 postid: String
};
const Post = mongoose.model("Post", postSchema);

const userSchema = new mongoose.Schema({
  googleId: String,
  username: String,
  email: String
})

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id,done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });});


  Post.aggregate(
     [
       { $sort : { date : -1 } }
     ]
  )
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "https://lit-ravine-59959.herokuapp.com/auth/google/beebash",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {

    User.findOne({
            googleId: profile.id
        }, function(err, user) {
            if (err) {
                return cb(err);
            }
            if (!user) {
                user = new User({
                    email: profile.emails[0].value,
                    username: profile.displayName,
                    googleId: profile.id
                });
                googleid = user.googleId;
                user.save(function(err) {
                    if (err) console.log(err);
                    return cb(err, user);
                });

            } else {
                //found user. Return
                googleid = user.googleId;
                return cb(err, user);
            }
        });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: 'https://localhost:3000/auth/facebook/beebash'
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    // In this example, the user's Facebook profile is supplied as the user
    // record.  In a production-quality application, the Facebook profile should
    // be associated with a user record in the application's database, which
    // allows for account linking and authentication with other identity
    // providers.
    User.findOrCreate({ FacebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }));

const posts =[];

app.get('/',function(req,res){
  Post.find({}, function(err, posts){

     res.render("home", {

       StartingContent: homeStartingContent,
       posts: posts
       });
   })
});

/////////////////////////////////////////////////////////USERHOME///////////////////////////////////////////////////////////

app.get('/userhome',function(req,res){
  if(req.isAuthenticated()){
    Post.find({}, function(err, posts){

       res.render("userhome", {

         StartingContent: homeStartingContent,
         posts: posts
         });
     })
  }
  else{
    res.redirect("/login")
  }
});

//////////////////////////////////////////////////////GOOGLE///////////////////////////////////////////////////////////
app.get("/auth/google",
  passport.authenticate("google",{scope:['email','profile']})
);


app.get("/auth/google/beebash",
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/userhome');
  });

  app.get('/auth/facebook',
    passport.authenticate('facebook'));

  app.get('/auth/facebook/beebash',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    function(req, res) {
      // Successful authentication, redirect home.
      res.redirect('/userhome');
    });

/////////////////////////////////////////////////////////LOGIN///////////////////////////////////////////////////////////
app.route('/login')
.get(function(req,res){
  res.render("login");
})
.post(function(req,res){
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, function(err) {
  if (err) { console.log(err); }
  else{
    passport.authenticate('local')(req,res,function(){
      res.redirect("/userhome")
    })
  }
});
})


/////////////////////////////////////////////////////////REGISTER///////////////////////////////////////////////////////////


app.route('/register')
.get(function(req,res){
  res.render("register");
})
// .post(function(req,res){
  // User.register({username: req.body.username},req.body.password,function(err,user){
  //   if(err)
  //   {
  //     console.log(err);
  //     res.redirect("/register");
  //   }
  //   else{
  //     passport.authenticate('local')(req,res,function(){
  //       res.redirect("/about")
  //     })
  //   }
  // })
// })
/////////////////////////////////////////////////////////ABOUT///////////////////////////////////////////////////////////
app.route('/about')
.get(function(req,res){
  res.render("about");
})
.post(function(req,res){
  username: req.body.username,
  res.redirect("/userhome",{username: username})
})
/////////////////////////////////////////////////////////CONTACT///////////////////////////////////////////////////////////

app.route('/contact')
.get(function(req,res){
  res.render("contact",{ContactContent:contactContent});
});

/////////////////////////////////////////////////////////PROFILE///////////////////////////////////////////////////////////

app.route('/profile')
.get(function(req,res){
  User.findOne({
          googleId: googleid
      }, function(err, user) {
          if (err) {
              return cb(err);
          }
          else
          {
            res.render("profile",
          {
            Username: user.username,
            Email: user.email,
            Googleid : user.googleId
          })
          }
        });

})
.post(function(req,res){
  let postDate = new Date().getDate()+'/'+(new Date().getMonth()+1)+'/'+new Date().getFullYear();
  const post = new Post ({
 title: req.body.inputtitle,
author: req.body.personname,
 des: req.body.description,
 date: postDate,
 postid: req.body.persongid
  })
   post.save(function(err){

   if (!err){
    res.redirect("/userhome");
  }

});

})

/////////////////////////////////////////////////////////SEARCH///////////////////////////////////////////////////////////

app.get("/posts/:id",function(req,res){
  const idd = req.params.id;
  Post.findById(idd,function(err,post){
    if(post.postid === googleid)
    {
      res.render("changes",{

        title: post.title,
        author:post.author,
        date:post.date,
        des: post.des,
        id:  post._id
      })
    }
    else{
      res.render("post", {

        title: post.title,
        author:post.author,
        date:post.date,
        des: post.des

      });
    }

})
})
////////////////////////////////////////////
// app.get("/edit/:id", (req, res) => {
//   const requestedId = req.params.id;
//   console.log(req.body);
//   Post.findOne({
//     _id: requestedId
//   }, (err, post) => {
//     if (!err) {
//       res.render("edit", {
//         title: post.title,
//         des: post.des
//       });
//     }
//   });
// });
app.get("/edit",function(req,res){
  res.render("/edit");
})

app.post("/edit/:id", (req, res) => {
  const newid = mongoose.Types.ObjectId(req.params.id);
  Post.findOne({
    _id: newid
  }, (err, post) => {
    console.log(post._id);
    if (!err) {
      console.log(post.title);
      res.render("edit", {
        title: post.title,
        des: post.des,
        id: post._id
      });
    }
    else{
      console.log(err);
    }
  });
});
app.post("/edit",(req, res) => {
 const newwid =  mongoose.Types.ObjectId(req.body.postID);

let postDate = new Date().getDate()+'/'+(new Date().getMonth()+1)+'/'+new Date().getFullYear();
  Post.updateOne(
    {_id: newwid},
    {
      title: req.body.postTitle,
      des: req.body.postBody,
      date: postDate
    },
    function(err,post)
    {
      if(!err)
      {
        console.log(post.title);
        res.redirect("/userhome");
      }
      else{
        console.log(err);
      }
    }
  );
});
/////////////////////////////////////////////////////////Update///////////////////////////////////////////////////////////
// app.get("/update",function(req,res){
//   res.render("update");
// })
// app.post("/update",function(req,res){
//   const postiddd = req.body.update;
//   Post.findById(postiddd,function(err){
//     if(!err)
//     {
//       res.render("update",{
//         title: post.title,
//         des: post.des,
//         id: post._id
//       })
//     }
//   })
// })
// /////////////////////////////////////////////////////////CHANGES///////////////////////////////////////////////////////////
app.get("/changes",function(req,res){
  res.render("/changes");
})
/////////////////////////////////////////////////////////DELETE///////////////////////////////////////////////////////////

app.post("/delete", function(req, res){
    const postidd = req.body.delete;
    Post.findByIdAndRemove(postidd, function(err)
    {
        if(!err)
        {
            console.log("Successfully Deleted");
        }
    });
    res.redirect('/userhome');
});

// app.post("/changes",function(req,res){
//   const del = req.body.id;
//   Post.deleteOne({_id : del},function(err){
//     if(err){
//       console.log(err);
//     }
//     else{
//       console.log("Successful!");
//       res.redirect("/username")
//     }
//   })
// })
// app.get("/posts/:topic",function(req,res){
//   const store = _.lowerCase(req.params.topic);
//
//   posts.forEach(function(post){
//     const storedtitle = _.lowerCase(post.title);
//     if( storedtitle === store )
//       res.render("post",{title:post.title,des:post.des});
//     else
//     console.log("Not Found");
//   });
//
// })
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port,function(){
  console.log("Server is running on port");
});

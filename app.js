// C:\Program Files\MongoDB\Server\4.4\bin

var express = require('express');
var passport = require("passport");
var bodyParser  = require("body-parser");
var mongoose = require("mongoose");
var LocalStrategy= require("passport-local");
var passportLocalMongoose = require("passport-local-mongoose");
var flash = require("connect-flash");

var app = express();


mongoose.connect('mongodb://localhost/store', {useNewUrlParser: true, useUnifiedTopology: true});
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended:true}));
mongoose.set('useFindAndModify', false);

var userSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
  type: String,
  cart: []
});

userSchema.plugin(passportLocalMongoose);

var User = mongoose.model("User", userSchema);

var productSchema = new mongoose.Schema({
  title: String,
  desc: String,
  image: String,
  price: String,
  keyword: String
})

var Product = mongoose.model("Product", productSchema);

var contactSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
  phone: String,
});

var Contact = mongoose.model("Contact", contactSchema);

var commentSchema = new mongoose.Schema({
  user: String,
  message: String,
  product: String
});

var Comment  = mongoose.model("Comment", commentSchema);

//PASSPORT CONFIG
app.use(require('express-session')({
  secret: "I can do it!",
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(flash());

app.use(function(req,res,next){   
  res.locals.currentUser = req.user;
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  next();
});

isLoggedIn = function(req,res,next){
  if(req.isAuthenticated()){
      return next();
  }
  req.flash("error", "Please Login first!");
  res.redirect("/login");
}

isAdmin = function(req, res, next){
  if(req.user.type == 0){
    return next();
  }
  req.flash("error", "You need to be logged in from an admin account to do that!");
  res.redirect('/login');
}

app.get('/', function(req, res){
  Product.find({}, function(err, product){
    if(err){
      res.send("Something went wrong!");
      console.log(err);
    } else {
      res.render("home.ejs", {product: product});
    }
  });
});

app.get('/login', function(req, res){
  res.render('login.ejs');
});

app.get('/signup', function(req, res){
  res.render("signup.ejs");
})

app.post("/signup", function(req, res){
  User.register(new User({username: req.body.username, email: req.body.email, type: req.body.type}), req.body.password, function(err, user){
      if(err){
          req.flash("error", err.message);
          res.redirect("/signup");
      }
      passport.authenticate("local")(req,res, function(){
          res.redirect("/");
      });    
  });
})

app.post("/login", passport.authenticate("local", {
  successRedirect: "/",
  failureRedirect: "/login",
  failureFlash: true
}), function(req,res){
});

app.get("/logout" ,function(req,res){
  req.logOut();
  req.flash("success", "Successfully logged out!");
  res.redirect("/");
});

app.get('/admin', isLoggedIn, isAdmin, function(req, res){
  Product.find({}, function(err, product){
    if(err){
      res.send("Something went wrong!");
    } else {
      res.render("admin-main.ejs", {product: product});
    }
  })
});

app.get('/admin/add', isLoggedIn, isAdmin, function(req, res){
  Product.find({}, function(err, product){
    if(err){
      res.send("Something went wrong!");
    } else {
      res.render("add-products.ejs", {product: product});
    }
  })
});

app.post('/admin/product', isLoggedIn, isAdmin, function(req, res){
  var product = {
    title: req.body.title,
    desc: req.body.desc,
    image: req.body.image,
    price: req.body.price,
    keyword: req.body.keyword
  }

  Product.create(product, function(err, result){
    if(err){
      res.send("Something went wrong!");
      console.log(err);
    } else {
      res.redirect('/admin/products');
    }
  });
});

app.get('/admin/products', isLoggedIn, isAdmin, function(req, res){
  Product.find({}, function(err, product){
    if(err){
      res.send("Something went wrong!");
      console.log(err);
    } else {
      res.render("admin-products.ejs", {product: product});
    }
  })
});

app.get('/admin/remove/:id', function(req, res){
  Product.findByIdAndRemove(req.params.id, function(err, product){
    if(err){
      res.send("Something went wrong!");
      console.log(err);
    } else {
      req.flash('success', 'Product removed!');
      res.redirect('/admin/products');
    }
  });
})

app.get('/product/:id', function(req, res){
  Product.find({}, function(err, other){
    if(err){
      res.send("Something went wrong!");
      console.log(err);
    } else {
      Product.findById(req.params.id, function(err, products){
        if(err){
          res.send("Something went wrong!");
          console.log(err);
        } else {
          Comment.find({}, function(err, comments){
            if(err){
              res.send("Something went wrong!")
              console.log(err);
            } else {
              res.render("show.ejs", {products: products, other: other, comments: comments});
            }
          })
        }
      });
    }
  })
});

app.post('/comment/:id', isLoggedIn, function(req, res){

  var comment = {
    user: req.user.username,
    message: req.body.message,
    product: req.params.id
  }

  Comment.create(comment, function(err, comments){
    if(err){
      res.send("Something went wrong!");
      console.log(err);
    } else {  
      res.redirect("/product/" + req.params.id)
    }
  });
});

app.post("/search", function(req, res){
   var input = req.body.input;

   Product.find({}, function(err, product){
     res.render('search.ejs', {input: input, product: product});
   });
});

app.get('/products', function(req, res){
  Product.find({}, function(err, product){
    if(err){
      res.send("Something went wrong!");
      console.log(err);
    } else {
      res.render('products.ejs', {product: product});
    }
  })
});

app.get('/contact', function(req, res){
  Product.find({}, function(err, product){
    if(err){
      res.send("Something went wrong!");
      console.log(err);
    } else {
      res.render("contact.ejs", {product: product});
    }
  });
});

app.post('/contact', function(req, res){
  var contact = {
    name: req.body.name,
    phone: req.body.phone,
    email: req.body.email,
    message: req.body.message
  };

  Contact.create(contact, function(err, result){
    if(err){
      res.send("Something went wrong!");
      console.log(err);
    } else {
      req.flash("success", "We'll get back to you shortly! Thank you for contacting us.");
      res.redirect('/contact');
    }
  });
});

app.get('/product/cart/:id',isLoggedIn, function(req, res){
  var check = false;
  for(var i = 0; i < req.user.cart.length; i++){
      if(req.params.id == req.user.cart[i]){
          check = true;
      }
  }

  if(!check){
      User.findByIdAndUpdate(req.user._id, {
          $push:{cart: req.params.id}
      }, {new : true}, function(err, result){
          if(err){
              res.send("Something went wrong!");
              console.log(err);
          } else {
              req.flash("success", "Product added to cart");
              res.redirect("/cart");
          }
      });
  } else {
      req.flash("error", "Product is already in cart");
      res.redirect("/cart");
  }
})

app.get('/cart/remove/:id', function(req,res){
  User.findByIdAndUpdate(req.user._id, {
      $pull:{cart: req.params.id}
  }, {new : true}, function(err, result){
      if(err){
          res.send("Something went wrong!");
          console.log(err);
      } else {
        req.flash("success", "Product removed from cart");
        res.redirect("/cart");
      }
  });
});

app.get('/cart' ,isLoggedIn, function(req, res){
  Product.find({}, function(err, product){
      if(err){
          res.send("Something went wrong!");
      } else {
          res.render("cart.ejs", {product: product});
      }
  })
})

app.get('/merch', function(req, res){
  res.render("merch.ejs");
});

app.listen(3000, function(){
  console.log("Server has started on port 3000");
});

require('dotenv').config();
const express = require('express');
const { engine, create } = require('express-handlebars');
const bcrypt = require('bcrypt');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const User = require('./models/User'); 
const flash = require('connect-flash');
const GitHubStrategy = require('passport-github').Strategy;

const app = express();
const port = 3000;


const Todo = require('./models/Todo')
const FoodItem = require('./models/FoodItem');
const Exercise = require('./models/Exercise');
const Sleep = require('./models/Sleep'); 
const CalendarEvent = require('./models/CalendarEvent');


// MongoDB connection
mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Express and Passport Session setup
app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: process.env.SESSION_SECRET, 
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Passport local strategy for authentication
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = await User.findOne({ username: username });
    if (!user) return done(null, false);

    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) return done(null, user);
    return done(null, false);
  } catch (e) {
    return done(e);
  }
}));

// Serialize and deserialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (e) {
    done(e);
  }
});

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: "https://js-betterproductivity.onrender.com/auth/github/callback"
},
async function(accessToken, refreshToken, profile, done) {
  try {
    let user = await User.findOne({ githubId: profile.id });
    if (!user) {
      user = await User.create({ 
        githubId: profile.id, 
        username: profile.username // Or any other relevant info
      });
    }
    return done(null, user);
  } catch (e) {
    return done(e);
  }
}
));

// Handlebars setup
const hbs = require('express-handlebars').create({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir: 'views/layouts/',
  // other configurations...
  runtimeOptions: {
      allowProtoPropertiesByDefault: true,
      allowProtoMethodsByDefault: true,
  },
});


hbs.handlebars.registerHelper('select', function(selected, options) {
  return options.fn(this).replace(new RegExp(' value=\"' + selected + '\"'), '$& selected="selected"');
});

hbs.handlebars.registerHelper('formatDate', function(dateString) {
  const date = new Date(dateString);
  const formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  return formattedDate;
});

hbs.handlebars.registerHelper('formatDate', function(date) {
  if (!date) return '';
  return date.toISOString().split('T')[0]; // Format as 'YYYY-MM-DD'
});

app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');

app.use(express.static('public'));

hbs.handlebars.registerHelper('eq', function(val1, val2) {
  return val1 === val2;
});

app.get('/auth/github',
  passport.authenticate('github'));

  app.get('/auth/github/callback', 
  passport.authenticate('github', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });

// Routes
app.get('/', (req, res) => {
  const successMessage = req.flash('success')[0];
  console.log(req.user)
  res.render('home', { user: req.user, message: successMessage });
});



app.get('/login', (req, res) => {
  const message = req.flash('error')[0]; 
  res.render('login', { message: message });
});;


app.get('/register', (req, res) => {
  res.render('register'); 
});

app.post('/register', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = new User({
      username: req.body.username,
      password: hashedPassword
    });
    await user.save();
    
    // Redirect to the login page with a query parameter
    req.flash('success', 'Successfully created account');
    res.redirect('/login?registered=true');
  } catch {
    res.redirect('/register');
  }
});

app.get('/login', (req, res) => {
  const successMessage = req.flash('success')[0];
  const errorMessage = req.flash('error')[0];
  res.render('login', { 
    success: successMessage,
    error: errorMessage
  });
});


app.post('/login', passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: true
}), (req, res) => {
  req.flash('success', 'Successfully logged in');
  res.redirect('/');
});





app.get('/logout', (req, res) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});



// Middleware for protected routes
function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

// Profile route
app.get('/profile', checkAuthenticated, async (req, res) => {
  try {
      const user = await User.findById(req.user._id).lean();
      const message = req.flash('success')[0];
      res.render('profile', { user, message: message });
  } catch (err) {
      console.error(err);
      res.redirect('/');
  }
});


// Edit user profile
app.post('/profile/edit', checkAuthenticated, async (req, res) => {
  try {
      const user = await User.findById(req.user._id);
      const { currentPassword, newPassword, confirmNewPassword } = req.body;

      // Check if current password is correct
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
          req.flash('error', 'Current password is incorrect');
          return res.redirect('/profile');
      }

      // Check if new password and confirmation match
      if (newPassword !== confirmNewPassword) {
          req.flash('error', 'New passwords do not match');
          return res.redirect('/profile');
      }

      // Update the user's password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save();

      req.flash('success', 'Profile updated successfully');
      res.redirect('/profile');
  } catch (err) {
      console.error(err);
      req.flash('error', 'Error updating profile');
      res.redirect('/profile');
  }
});

// Delete user account
app.post('/profile/delete', checkAuthenticated, async (req, res) => {
  try {
      await User.findByIdAndDelete(req.user._id);
      req.logout();
      req.flash('success', 'Account deleted');
      res.redirect('/login');
  } catch (err) {
      console.error(err);
      res.redirect('/profile');
  }
});



// Protected routes
app.get('/todo', checkAuthenticated, async (req, res) => {
  const todos = await Todo.find({ user: req.user._id }).lean(); 
  console.log("To-dos:", todos); 
  res.render('todo', { todos: todos, user: req.user });
});


app.post('/todo/add', checkAuthenticated, async (req, res) => {
  const newTodo = new Todo({
    content: req.body.content,
    completed: false,
    user: req.user._id
  });
  await newTodo.save();
  res.redirect('/todo');
});

// Route to display edit form
app.get('/todo/edit/:id', checkAuthenticated, async (req, res) => {
  const todo = await Todo.findById(req.params.id).lean();
  res.render('edit-todo', { todo: todo }); 
});

// Route to handle edit form submission
app.post('/todo/edit/:id', checkAuthenticated, async (req, res) => {
  await Todo.findByIdAndUpdate(req.params.id, { content: req.body.content });
  res.redirect('/todo');
});

// Route to delete a to-do item
app.post('/todo/delete/:id', checkAuthenticated, async (req, res) => {
  await Todo.findByIdAndDelete(req.params.id);
  res.redirect('/todo');
});


app.get('/pomodoro', checkAuthenticated, (req, res) => {
  res.render('pomodoro', { user: req.user});
});

app.get('/diet', checkAuthenticated, async (req, res) => {
  const foodItems = await FoodItem.find({ user: req.user._id }).lean();
  res.render('diet', { foodItems, user: req.user });
});

// Route to add a new food item
app.post('/diet/add', checkAuthenticated, async (req, res) => {
  const newFoodItem = new FoodItem({
    name: req.body.name,
    carbs: req.body.carbs,
    protein: req.body.protein,
    calories: req.body.calories,
    user: req.user._id
  });
  await newFoodItem.save();
  res.redirect('/diet');
});

app.get('/diet/edit/:id', checkAuthenticated, async (req, res) => {
  try {
    const foodItem = await FoodItem.findById(req.params.id).lean();
    res.render('edit-food', { foodItem });
  } catch (err) {
    console.error(err);
    res.redirect('/diet');
  }
});

// server.js
app.post('/diet/edit/:id', checkAuthenticated, async (req, res) => {
  try {
    await FoodItem.findByIdAndUpdate(req.params.id, {
      name: req.body.name,
      carbs: req.body.carbs,
      protein: req.body.protein,
      calories: req.body.calories
    });
    res.redirect('/diet');
  } catch (err) {
    console.error(err);
    res.redirect('/diet');
  }
});


app.post('/diet/delete/:id', checkAuthenticated, async (req, res) => {
  await FoodItem.findByIdAndDelete(req.params.id);
  res.redirect('/diet');
});

app.get('/fitness', checkAuthenticated, async (req, res) => {
  const exercises = await Exercise.find({ user: req.user._id }).lean();
  console.log("Exercises:", exercises);
  res.render('fitness', { exercises, user: req.user });
});


app.post('/fitness/add', checkAuthenticated, async (req, res) => {
  const newExercise = new Exercise({
    name: req.body.name,
    duration: req.body.duration,
    user: req.user._id
  });
  await newExercise.save();
  res.redirect('/fitness');
});

app.get('/fitness/edit/:id', checkAuthenticated, async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id).lean();
    res.render('edit-exercise', { exercise });
  } catch (err) {
    console.error(err);
    res.redirect('/fitness');
  }
});

app.post('/fitness/edit/:id', checkAuthenticated, async (req, res) => {
  try {
    await Exercise.findByIdAndUpdate(req.params.id, {
      name: req.body.name,
      duration: req.body.duration
    });
    res.redirect('/fitness');
  } catch (err) {
    console.error(err);
    res.redirect('/fitness');
  }
});

app.post('/fitness/delete/:id', checkAuthenticated, async (req, res) => {
  try {
    await Exercise.findByIdAndDelete(req.params.id);
    res.redirect('/fitness');
  } catch (err) {
    console.error(err);
    res.redirect('/fitness');
  }
});

app.get('/sleep', checkAuthenticated, async (req, res) => {
  const sleepEntries = await Sleep.find({ user: req.user._id }).lean();
  res.render('sleep', { sleepEntries: sleepEntries, user: req.user });
});

app.post('/sleep/add', checkAuthenticated, async (req, res) => {
  const newSleepEntry = new Sleep({
    quality: req.body.quality,
    duration: req.body.duration,
    date: req.body.date,
    user: req.user._id
  });
  await newSleepEntry.save();
  res.redirect('/sleep');
});

app.get('/sleep/edit/:id', checkAuthenticated, async (req, res) => {
  const sleepEntry = await Sleep.findById(req.params.id).lean();
  res.render('edit-sleep', { sleepEntry: sleepEntry });
});


app.post('/sleep/edit/:id', checkAuthenticated, async (req, res) => {
  await Sleep.findByIdAndUpdate(req.params.id, {
    quality: req.body.quality,
    duration: req.body.duration,
    date: req.body.date
  });
  res.redirect('/sleep');
});

app.post('/sleep/delete/:id', checkAuthenticated, async (req, res) => {
  await Sleep.findByIdAndDelete(req.params.id);
  res.redirect('/sleep');
});

// Display Calendar
app.get('/calendar', checkAuthenticated, async (req, res) => {
  const events = await CalendarEvent.find({ user: req.user._id }).lean();
  res.render('calendar', { events, user: req.user });
});

// Add Event
app.post('/calendar/add', checkAuthenticated, async (req, res) => {
  const { title, description, startDate, time } = req.body;
  const newEvent = new CalendarEvent({
    title,
    description,
    startDate,
    time,
    user: req.user._id
  });
  await newEvent.save();
  res.redirect('/calendar');
});

// Edit Event Form
app.get('/calendar/edit/:id', checkAuthenticated, async (req, res) => {
  const event = await CalendarEvent.findById(req.params.id).lean();
  res.render('edit-calendar-event', { event });
});

// Update Event
app.post('/calendar/edit/:id', checkAuthenticated, async (req, res) => {
  const { title, description, startDate, time } = req.body;
  await CalendarEvent.findByIdAndUpdate(req.params.id, {
    title,
    description,
    startDate,
    time
  });
  res.redirect('/calendar');
});


// Delete Event
app.post('/calendar/delete/:id', checkAuthenticated, async (req, res) => {
  await CalendarEvent.findByIdAndDelete(req.params.id);
  res.redirect('/calendar');
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port} - http://localhost:3000/`);
});

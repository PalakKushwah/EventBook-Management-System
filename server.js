const dotenv = require("dotenv").config();

const express = require("express");
const ejs = require("ejs");
const expressLayouts = require('express-ejs-layouts');
const path = require("path");
const dbConnection = require("./app/config/db");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const session = require('express-session');
const flash = require('connect-flash');
const passport =  require("./app/config/passport")


const app = express();

// Database connection
dbConnection();

// Middleware
app.use(express.json());
// app.use(cors({
//   origin: "http://localhost:3000",
//   credentials: true
// }));


const allowedOrigins = [
  process.env.FRONTEND_ATTENDEE,
  process.env.FRONTEND_ORGANIZER,
  'http://localhost:4000'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS not allowed from origin: ${origin}`));
    }
  },
  credentials: true
}));

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'session_secret_change_me',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax' }
}));
app.use(flash());
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

app.use(passport.initialize());
app.use(passport.session());

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set('layout', 'layouts/admin');
app.use(expressLayouts);

// Static file serving
app.use(express.static(path.join(__dirname, "public")));

//  Serve profile images for organizers and attendees
app.use("/uploads/organizers", express.static(path.join(__dirname, "uploads", "organizers")));
app.use("/uploads/attendees", express.static(path.join(__dirname, "uploads", "attendees")));

app.use("/uploads/events", express.static(path.join(__dirname, "uploads", "events")));
// Routes
const CreateAdminRouter = require("./app/routes/createAdminRouter")
app.use(CreateAdminRouter)

const AuthRoute = require("./app/routes/authRouter");
app.use("/api/auth", AuthRoute);

const PublicRoute = require("./app/routes/publicRouter");
app.use("/api/public", PublicRoute);

const EventRoute = require("./app/routes/eventRouter");
app.use("/api/event", EventRoute);

const RegisterRoute = require("./app/routes/registerRouter");
app.use("/api", RegisterRoute);
const TicketRouter = require('./app/routes/ticketRouter');
app.use('/api/tickets', TicketRouter);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Admin EJS views (SB Admin)
const AdminViewRouter = require('./app/routes/adminViewRouter')
app.use('/', AdminViewRouter)

// Server listen
const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/login`);
  console.log(`Server running at http://localhost:${port}/api-docs`);
});

const express = require('express');
const path = require('path');
const utils = require('./lib/hashUtils');
const partials = require('express-partials');
const bodyParser = require('body-parser');
const Auth = require('./middleware/auth');
const models = require('./models');
const parseCookie = require('./middleware/cookieParser');

const app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));



app.get('/', 
(req, res) => {
  //check if the request has cookie
  console.log('GET request / cookie:', req.headers.cookie);
  // if (req.headers.cookie) {
  //   // cookie found, parse it and get the session
    
  // } else {
    res.redirect('/login');
  // }
});

app.get('/create', 
(req, res) => {
  res.render('index');
});


app.get('/links', 
(req, res, next) => {
  models.Links.getAll()
    .then(links => {
      res.status(200).send(links);
    })
    .error(error => {
      res.status(500).send(error);
    });
});

app.post('/links', 
(req, res, next) => {
  var url = req.body.url;
  if (!models.Links.isValidUrl(url)) {
    // send back a 404 if link is not valid
    return res.sendStatus(404);
  }

  return models.Links.get({ url })
    .then(link => {
      if (link) {
        throw link;
      }
      return models.Links.getUrlTitle(url);
    })
    .then(title => {
      return models.Links.create({
        url: url,
        title: title,
        baseUrl: req.headers.origin
      });
    })
    .then(results => {
      return models.Links.get({ id: results.insertId });
    })
    .then(link => {
      throw link;
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(link => {
      res.status(200).send(link);
    });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/
// app.get('/login', 
// (req, res) => {
//   res.render('login');
// });

// app.post('/login', 
// (req, res) => {
//   var name = req.body.username;
//   var pw = req.body.password;
//   models.Users.get({username: name})
//   .then((user) => {
    
//     if (user) {
//     //Found user
//       var comparison = models.Users.compare(pw, user.password, user.salt);
//       if (comparison) {
//         // TODO: Parse cookie for session
//         console.log('Request headers', req.headers);
//         var session = parseCookie(req);
//         console.log('session: ', session);
//         if (session && !models.Sessions.isLoggedIn(session)) {
//           //Session not found
//           //Give a session token to user
//           models.Sessions.create()
//           .then((session) => {
//             console.log('Session created:', session.insertId);
//             var id = session.insertId;
//             console.log('user', user);
//             models.Sessions.update({id: id}, {userId: user.id});
//             models.Sessions.get({id: id})
//             .then((session) => {
//               console.log(session);
//               res.set('Set-Cookie', JSON.stringify(session));
//               res.status(200);
//               res.redirect('/');
//             });
//           });
//         } else {
//           // res.
//           console.log('session found!', session);
//           // session.userId
//           res.redirect('/');
//         }
//       } else {
//         console.log('Password MisMatch :(');
//         res.status(401);
//         res.redirect('/login');
//       }
//     } else {
//       //user not found
//       console.log('Username Not Found');
//       res.status(302);
//       res.redirect('/login');
//     }
//   }, (fail) => {
//     //No user of that name found
//     console.log('Username Not Found, failed: ', fail);
//     res.status(401);
//     res.redirect('/login');
//   });
// });

app.post('/login', 
(req, res) => {
  var name = req.body.username;
  var pw = req.body.password;
  models.Users.get({username: name})
  .then((user) => {
    if (user) {
      var pwMatch = models.Users.compare(pw, user.password, user.salt);
      if (pwMatch) {
        if (req.headers && req.headers.cookie) {
          
        } else {
          
          Auth.createSession(req, res);
          res.redirect('/');
        }
      } else {
        res.redirect('/login');
      }
    } else {
      // console.log('user not found:', user);
      res.redirect('/login');
    }
  });
});

// app.get('/signup', 
// (req, res) => {
//   res.render('signup');
// });

app.post('/signup', 
(req, res) => {
  var name = req.body.username;
  var pw = req.body.password;
  //check if user already exists
  // models.Users.get({username: name})
  // .then((user) => {
  //   if (user) {
  //     //user found
  //     res.status(401);
  //     res.redirect('/signup');
  //   } else {
  //     // user not found
  //     models.Users.create({username: name, password: pw, sessionId: null})
  //     .then((user) => {
  //       res.status(200);
  //       res.redirect('/');
  //     }, (fail) => {
  //       res.status(401);
  //       console.log('Sign Up Unsuccessful', fail);
  //       res.redirect('/');
  //     });
  //   }
  // }, (fail) => {
  //   res.status(401);
  //   console.log('Sign Up Unsuccessful', fail);
  //   res.redirect('/');
  // });
  
  models.Users.get({username: name})
  .then((user) => {
    if (user) {
      res.redirect('/signup');
    } else {
      models.Users.create({username: name, password: pw})
  .then((user) => {
    res.redirect('/');
  });
    }
  });
  
  
});

/************************************************************/
// Handle the code parameter route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/:code', (req, res, next) => {

  return models.Links.get({ code: req.params.code })
    .tap(link => {

      if (!link) {
        throw new Error('Link does not exist');
      }
      return models.Clicks.create({ linkId: link.id });
    })
    .tap(link => {
      return models.Links.update(link, { visits: link.visits + 1 });
    })
    .then(({ url }) => {
      res.redirect(url);
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(() => {
      res.redirect('/');
    });
});

module.exports = app;

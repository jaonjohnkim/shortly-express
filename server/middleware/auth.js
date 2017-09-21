const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
  if (req.headers.keys && req.headers.cookies) {
    // req.cookies.shortlyid
    console.log('Why am i here');
  } else {
    models.Sessions.create()
    .then((session) => {
      console.log('Session created:', session.insertId);
      var id = session.insertId;
      models.Sessions.get({id: id})
      .then((session) => {
        // console.log('session:', session);
        req.session = session;
        res.cookies = { shortlyid: session.hash, value: null };
        // console.log('response cookies:', res.cookies);
        next();
      });
    });
  }
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

const parseCookies = (req, res, next) => {
  console.log('request', req);
  if (req.headers && req.headers.cookie) {
    // console.log('found cookie');
    var parsed = {};
    req.headers.cookie.split(';').forEach((cookie) => {
      var split = cookie.split('=');
      parsed[split[0].replace(' ', '')] = split[1];
    });
    // console.log('FINAL PARSED:', parsed);
    req.cookies = parsed;
  } else {
    req.cookies = {};
  }
  next();
};

module.exports = parseCookies;
//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
var cookieParser = require('cookie-parser');
const dotenv = require('dotenv').config();
// var AWS = require('aws-sdk/global');

var AmazonCognitoIdentity = require('amazon-cognito-identity-js');

const app = express();
app.use(cookieParser())

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

var CognitoUserPool = AmazonCognitoIdentity.CognitoUserPool;
var poolData = {
  UserPoolId: process.env.UserPoolId, // Your user pool id here
  ClientId: process.env.ClientId, // Your client id here
};
var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

// Given userName and session tokes, check if user is logged in.
function checkLogIn(userName, tokens) {
  var result;
  const AccessToken = new AmazonCognitoIdentity.CognitoAccessToken({AccessToken: tokens.accessToken});
  const IdToken = new AmazonCognitoIdentity.CognitoIdToken({IdToken: tokens.idToken});
  const RefreshToken = new AmazonCognitoIdentity.CognitoRefreshToken({RefreshToken: tokens.refreshToken});

  const sessionData = {
    IdToken: IdToken,
    AccessToken: AccessToken,
    RefreshToken: RefreshToken
  };

  const userSession = new AmazonCognitoIdentity.CognitoUserSession(sessionData);

  const userData = {
    Username: userName,
    Pool: userPool
  };
  const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
  cognitoUser.setSignInUserSession(userSession);

  cognitoUser.getSession(function(err, session) {
    if (session.isValid()) {
      result = true;
    } else {
      result = false;
    }
  });

  return result;
}

app.get('/', function(req, res) {
  if ('tokens' in req.cookies && 'username' in req.cookies) {
    const tokens = req.cookies['tokens'];
    const userName = req.cookies['username'];

    var isLoggedIn = checkLogIn(userName, tokens);

    if (isLoggedIn) {
      res.render('display');
    } else {
      res.sendFile('index.html', {root: __dirname})
    }
  } else {
    res.sendFile('index.html', {root: __dirname})
  }
});

app.get('/log-in', function(req, res) {
  res.sendFile('log-in.html', {root: __dirname})
});

app.get('/sign-up', function(req, res) {
  res.sendFile('sign-up.html', {root: __dirname})
});

app.post('/sign-up', function(req, res) {
  var userEmail = req.body.UserEmail;
  var userPassword = req.body.UserPassword;
  var attributeList = [];
  var dataEmail = {
    Name: 'email',
    Value: userEmail
  };
  var attributeEmail = new AmazonCognitoIdentity.CognitoUserAttribute(dataEmail);
  attributeList.push(attributeEmail);

  userPool.signUp(userEmail, userPassword, attributeList, null, function(err, result) {
    if (err) {
      console.log(err.message || JSON.stringify(err));
      return;
    }
    var cognitoUser = result.user;
    res.cookie('registeredUser', cognitoUser.getUsername());
    res.redirect('/confirm');
  });

});

app.get('/confirm', function(req, res) {
  if ('registeredUser' in req.cookies) {
    res.sendFile('confirm.html', {root: __dirname});
  } else {
    res.redirect('/sign-up');
  }
});

app.post('/confirm', function(req, res) {
  if ('registeredUser' in req.cookies) {
    code = req.body.Code;
    userName = req.cookies['registeredUser']
    var userData = {
      Username: userName,
      Pool: userPool
    };

    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    cognitoUser.confirmRegistration(code, true, function(err, result) {
      if (err) {
        console.log(err.message || JSON.stringify(err));
        res.redirect('/confirm')
      }
      res.clearCookie('registeredUser');
      console.log('call result: ' + result);
      res.redirect('/log-in')
    });
  } else {
    res.redirect('/sign-up');
  }

})

app.post('/log-in', function(req, res) {
  var userEmail = req.body.UserEmail;
  var userPassword = req.body.UserPassword;
  var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({Username: userEmail, Password: userPassword});

  var userData = {
    Username: userEmail,
    Pool: userPool
  };
  var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
  cognitoUser.authenticateUser(authenticationDetails, {
    onSuccess: function(result) {
      storedUserName = userEmail;
      const tokens = {
        accessToken: result.getAccessToken().getJwtToken(),
        idToken: result.getIdToken().getJwtToken(),
        refreshToken: result.getRefreshToken().getToken()
      };
      globalTokens = tokens;
      res.cookie('username', userEmail);
      res.cookie('tokens', tokens);
      res.redirect('/display')
    },
    onFailure: function(err) {
      res.redirect('/log-in');
    }
  });
});

app.get('/display', function(req, res) {
  if ('tokens' in req.cookies && 'username' in req.cookies) {
    const tokens = req.cookies['tokens'];
    const userName = req.cookies['username'];

    var isLoggedIn = checkLogIn(userName, tokens);

    if (isLoggedIn) {
      res.render('display');
    } else {
      res.redirect('/');
    }
  } else {
    res.redirect('/');
  }

});

app.get('/logout', function(req, res) {
  res.clearCookie('username');
  res.clearCookie('tokens');
  res.clearCookie('registeredUser');
  console.log("Successfully logged out!")
  res.redirect('/');
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});

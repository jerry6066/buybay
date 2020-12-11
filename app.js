//jshint esversion:6
const request = require('request')
const express = require("express");
const bodyParser = require("body-parser");
var cookieParser = require('cookie-parser');
const dotenv = require('dotenv').config();
// var AWS = require('aws-sdk/global');
var ejs = require('ejs');

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
      res.redirect('/display');
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
  res.redirect('/display/page/1');
})

app.get('/display/page/:page_num', function(req, res) {
  if ('tokens' in req.cookies && 'username' in req.cookies) {
    const tokens = req.cookies['tokens'];
    const userName = req.cookies['username'];

    var isLoggedIn = checkLogIn(userName, tokens);

    if (isLoggedIn) {
      var page_num = req.params.page_num;
      url = process.env.GetAllItemURL + page_num;
      request(url, function(error, response, body) {
        // console.error('error:', error);  Print the error if one occurred
        // console.log('statusCode:', response && response.statusCode);  Print the response status code if a response was received
        // console.log('body:', body);  Print the HTML for the Google homepage.
        body = JSON.parse(body)
        // var body = {
        //   'status': true,
        //   'items': [
        //     {
        //       'item_id': '70f0f6d6-4e58-42f7-9bed-1ebef3b4dcd9',
        //       'item_name': 'ROG laptop',
        //       'user_id': 'bz2378@columbia.edu',
        //       'user_name': 'zhuoxu',
        //       'price': '1200',
        //       'main_img_url': 'https://item-imgs.s3.amazonaws.com/laptop.jpg',
        //       'num_visits': '1',
        //       'timestamp': '2020-12-10',
        //       'status': 'in stock'
        //     }
        //   ],
        //   'page': '1',
        //   'is_first_page': 'True',
        //   'is_last_page': 'False'
        // }
        var page = body['page'];
        var items = body['items'];
        var isFirstPage = body['is_first_page'];
        var isLastPage = body['is_last_page']

        // console.log(items)
        res.render('display', {
          page: page,
          items: items,
          isFirstPage: isFirstPage,
          isLastPage: isLastPage
        });
      });

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

app.get('/item/:itemID', function(req, res) {
  if ('tokens' in req.cookies && 'username' in req.cookies) {
    const tokens = req.cookies['tokens'];
    const userName = req.cookies['username'];
    var isLoggedIn = checkLogIn(userName, tokens);
    if (isLoggedIn) {
      var itemID = req.params.itemID;
      url = process.env.ItemDetailURL + itemID;
      const options = {
        url: url,
        method: 'GET',
        json: true,
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          'user_id': userName
        }
      };
      request(options, function(error, response, body) {
        //body = JSON.parse(body);
        var status = body['status'];
        if (status) {
          var item = body['item'];
          res.cookie('itemID', itemID);
          res.render('item', {item: item});
        } else {
          // Todo: No Item Found
          // render to error page
        }

      });

    } else {
      res.redirect('/');
    }
  } else {
    res.redirect('/');
  }

});

app.post('/writeComment', function(req, res) {
  const userName = req.cookies['username'];
  const content = req.body.comment;
  const itemID = req.cookies['itemID'];

  var options = {
    uri: process.env.WriteCommentURL,
    method: 'POST',
    json: {
      "item_id": itemID,
      "user_id": userName,
      "content": content
    }
  };

  request(options, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      res.redirect('/item/' + itemID);
    }
  });
})

app.get('/create', function(req, res) {
  if ('tokens' in req.cookies && 'username' in req.cookies) {
    const tokens = req.cookies['tokens'];
    const userName = req.cookies['username'];
    var isLoggedIn = checkLogIn(userName, tokens);
    if (isLoggedIn) {
      res.render('createItem');
    } else {
      res.redirect('/');
    }
  } else {
    res.redirect('/');
  }
});

app.get('/edit-item/:itemID', function(req, res) {
  if ('tokens' in req.cookies && 'username' in req.cookies) {
    const tokens = req.cookies['tokens'];
    const userName = req.cookies['username'];
    var isLoggedIn = checkLogIn(userName, tokens);
    if (isLoggedIn) {
      var itemID = req.params.itemID;
      url = process.env.ItemDetailURL + itemID;
      request(url, function(error, response, body) {
        body = JSON.parse(body);
        var status = body['status'];
        if (status) {
          var item = body['item'];
          if (item['user_id'] === userName) {
            console.log(item);
            // res.cookie('itemID', itemID);
            res.render('editItem', {item: item});
          } else {
            res.send("No Auth.")
          }

        } else {
          // Todo: No Item Found
          // render to error page
        }

      });
    } else {
      res.redirect('/');
    }
  } else {
    res.redirect('/');
  }
})

//Invalid Route
app.get('*', function(req, res) {
  res.sendFile('error.html', {root: __dirname});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function() {
  console.log("Server started.");
});

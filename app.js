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
  var userName = req.body.UserName;
  var attributeList = [];
  var dataEmail = {
    Name: 'email',
    Value: userEmail
  };
  var attributeEmail = new AmazonCognitoIdentity.CognitoUserAttribute(dataEmail);
  attributeList.push(attributeEmail);

  userPool.signUp(userEmail, userPassword, attributeList, null, function(err, result) {
    if (err) {
      console.log("error")
      var errorMsg = err.message || JSON.stringify(err);
      res.render('error', {
        error_msg: errorMsg
      })
    }

    var cognitoUser = result.user;
    res.cookie('registeredUser', cognitoUser.getUsername());
    res.cookie('registeredUserName', userName)
    res.redirect('/confirm');
  });

});

app.get('/confirm', function(req, res) {
  if ('registeredUser' in req.cookies) {
    var userEmail = req.cookies['registeredUser']
    var userName = req.cookies['registeredUserName']
    res.render('confirm', {
      email: userEmail,
      username: userName
    });
  } else {
    res.redirect('/sign-up');
  }
});

app.post('/confirm', function(req, res) {
  if ('registeredUser' in req.cookies) {
    code = req.body.Code;
    // userName = req.cookies['registeredUser']
    userName = req.body.UserEmail;
    var userData = {
      Username: userName,
      Pool: userPool
    };

    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    cognitoUser.confirmRegistration(code, true, function(err, result) {
      if (err) {
        var errorMsg = err.message || JSON.stringify(err);
        res.render('error', {
          error_msg: errorMsg
        })
        // res.redirect('/confirm')
      }
      res.clearCookie('registeredUser');
      res.clearCookie('registeredUserName')
      // Todo : send info to lambda
      url = process.env.CreateUserURL;
      const options = {
        url: url,
        method: 'POST',
        json: true,
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          'user_id': userName,
          'user_name': req.body.UserName
        }
      };
      request(options, function(error, response, body) {
        // body = JSON.parse(body);
        var status = body['status'];
        res.redirect('/log-in')

      });
      // console.log('call result: ' + result);

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
      var errorMsg = err.message;
      res.render('error', {
        error_msg: errorMsg
      })
    }
  });
});

app.get('/display', function(req, res) {
  res.redirect('/display/page/1');
});

app.get('/display/page/:page_num', function(req, res) {
  if ('tokens' in req.cookies && 'username' in req.cookies) {
    const tokens = req.cookies['tokens'];
    const userName = req.cookies['username'];

    var isLoggedIn = checkLogIn(userName, tokens);

    if (isLoggedIn) {
      var page_num = req.params.page_num;
      if (isNaN(page_num)) {
        res.render('error', {error_msg: "Invalid URL"})
      } else {
        page_num = parseInt(page_num).toString();
        url = process.env.GetAllItemURL + page_num;
        request(url, function(error, response, body) {
          // console.error('error:', error);  Print the error if one occurred
          // console.log('statusCode:', response && response.statusCode);  Print the response status code if a response was received
          // console.log('body:', body);  Print the HTML for the Google homepage.
          body = JSON.parse(body)
          var page = body['page'];
          var items = body['items'];
          var isFirstPage = body['is_first_page'];
          var isLastPage = body['is_last_page']

          // console.log(items)
          res.render('display', {
            page: page,
            items: items,
            isFirstPage: isFirstPage,
            isLastPage: isLastPage,
            keywords: ""
          });
        });
      }

    } else {
      res.redirect('/');
    }
  } else {
    res.redirect('/');
  }

});

app.get('/display/search/:keyword', function(req, res) {
  keyword = req.params.keyword;
  res.redirect('/display/search/' + keyword + '/page/1');
});

app.get('/display/search/:keyword/page/:page_num', function(req, res) {
  if ('tokens' in req.cookies && 'username' in req.cookies) {
    const tokens = req.cookies['tokens'];
    const userName = req.cookies['username'];

    var isLoggedIn = checkLogIn(userName, tokens);

    if (isLoggedIn) {
      var page_num = req.params.page_num;
      var keyword = req.params.keyword;
      if (isNaN(page_num)) {
        res.render('error', {error_msg: "Invalid URL"})
      } else {
        page_num = parseInt(page_num).toString();
        url = process.env.SearchItemURL + keyword + '/page/' + page_num;
        request(url, function(error, response, body) {
          console.log(body)
          body = JSON.parse(body)
          var page = body['page'];
          var items = body['items'];
          console.log(items)
          var isFirstPage = body['is_first_page'];
          var isLastPage = body['is_last_page']
          var keywords = body['key_words'];
          // console.log(items)
          res.render('display', {
            page: page,
            items: items,
            isFirstPage: isFirstPage,
            isLastPage: isLastPage,
            keywords: keywords
          });
        });
      }

    } else {
      res.redirect('/');
    }
  } else {
    res.redirect('/');
  }
})

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
          var isOwner;
          if (item['user_id'] === userName) {
            isOwner = true;
          } else {
            isOwner = false;
          }
          res.cookie('itemID', itemID);
          res.render('item', {
            item: item,
            isOwner: isOwner
          });
        } else {
          res.render('error', {error_msg: "Item Not Found."});
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
        // body = JSON.parse(body);
        var status = body['status'];
        if (status) {
          var item = body['item'];
          if (item['user_id'] === userName) {
            // console.log(item);
            // res.cookie('itemID', itemID);
            res.render('editItem', {item: item});
          } else {
            res.render('error', {error_msg: "No Authorization."});
          }

        } else {
          res.render('error', {error_msg: "Item Not Found."});
        }

      });
    } else {
      res.redirect('/');
    }
  } else {
    res.redirect('/');
  }
})

app.get('/user', function(req, res) {
  if ('tokens' in req.cookies && 'username' in req.cookies) {
    const tokens = req.cookies['tokens'];
    const userName = req.cookies['username'];
    var isLoggedIn = checkLogIn(userName, tokens);
    if (isLoggedIn) {
      url = process.env.GetUserProfile + "0"
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
        var items = body['item'];
        var user_name = body['user_name'];
        var email = body['user_id'];
        var num_items = body['num_items']
        res.render('user', {
          items: items,
          user_name: user_name,
          email: email,
          num_items: num_items,
          isOwner: true
        });
      });
    } else {
      res.redirect('/');
    }
  } else {
    res.redirect('/');
  }
})

app.get('/user/:user_id', function(req, res) {
  if ('tokens' in req.cookies && 'username' in req.cookies) {
    const tokens = req.cookies['tokens'];
    const userName = req.cookies['username'];
    var isLoggedIn = checkLogIn(userName, tokens);
    if (isLoggedIn) {
      uid = req.params.user_id;
      url = process.env.GetUserProfile + uid;
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
        var items = body['item'];
        var user_name = body['user_name'];
        var email = body['user_id'];
        var num_items = body['num_items']
        var isOwner = false;
        if(email === userName) {
          isOwner = true;
        }
        res.render('user', {
          items: items,
          user_name: user_name,
          email: email,
          num_items: num_items,
          isOwner: isOwner
        });
      });
    } else {
      res.redirect('/');
    }
  } else {
    res.redirect('/');
  }
})

app.get('/delete-item/:item_id', function(req, res) {
  if ('tokens' in req.cookies && 'username' in req.cookies) {
    const tokens = req.cookies['tokens'];
    const userName = req.cookies['username'];
    var isLoggedIn = checkLogIn(userName, tokens);
    if (isLoggedIn) {
      item_id = req.params.item_id;
      url = process.env.ItemDetailURL + item_id;
      const options = {
        url: url,
        method: 'DELETE',
        json: true,
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          'user_id': userName
        }
      };
      request(options, function(error, response, body) {
        var status = body['status']
        if (status === true) {
          res.redirect('/user')
        } else {
          res.render('error', {
            error_msg: "Delete Error."
          });
        }
      });

    } else {
      res.redirect('/');
    }
  } else {
    res.redirect('/');
  }
});

app.get('/chats', function(req, res) {
  if ('tokens' in req.cookies && 'username' in req.cookies) {
    const tokens = req.cookies['tokens'];
    const userName = req.cookies['username'];
    var isLoggedIn = checkLogIn(userName, tokens);
    if (isLoggedIn) {
      url = process.env.GetAllChats;
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
        var status = body['status']
        console.log(body)
        if (status === true) {
          chats = body['chats']
          res.render('chats', {
            chats: chats
          });
        } else {
          res.render('error', {
            error_msg: "Error."
          });
        }
      });
    } else {
      res.redirect('/');
    }
  } else {
    res.redirect('/');
  }
})

app.get('/chats/:chat_id', function(req, res) {
  if ('tokens' in req.cookies && 'username' in req.cookies) {
    const tokens = req.cookies['tokens'];
    const userName = req.cookies['username'];
    var isLoggedIn = checkLogIn(userName, tokens);
    if (isLoggedIn) {

      chat_id = req.params.chat_id;
      url = process.env.GetChat + chat_id + '/0';
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
        var status = body['status']
        if (status === true) {
          chats = body['chats']
          to_user = body['to_user']
          res.render('currentChat', {
            chats: chats,
            to_user: to_user
          });
        } else {
          res.render('error', {
            error_msg: "Error."
          });
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
  res.render('error', {error_msg: "404 Page Not Found."});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function() {
  console.log("Server started.");
});

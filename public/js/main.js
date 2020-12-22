$("#SignUpButton").click(function(event) {
  var email = $('#SignUpEmail').val();
  var pwd = $('#SignUpPassword').val();
  var username = $('#SignUpUserName').val();

  if (email.length === 0) {
    alert('Please enter a valid email.');
    event.preventDefault();
  } else if (pwd.length < 8) {
    alert('Password at least 8 characters.');
    event.preventDefault();
  } else if (username.length === 0) {
    alert('Please enter a user name.');
    event.preventDefault();
  }
});

$("#LogInButton").click(function(event) {
  var email = $('#LogInEmail').val();
  var pwd = $('#LogInPassword').val();

  if (email.length === 0) {
    alert('Please enter a valid email.');
    event.preventDefault();
  } else if (pwd.length < 8) {
    alert('Password at least 8 characters.');
    event.preventDefault();
  }
});

$("#CodeButton").click(function(event) {
  var code = $('#Code').val();
  var email = $('#SignUpEmail').val();
  var username = $('#SignUpUserName').val();

  if (code.length == 0) {
    alert("Invalid code!");
    event.preventDefault();
  }

  if (email.length === 0) {
    alert('Please enter your email address');
    event.preventDefault();
  } else if (username.length === 0) {
    alert('Please enter your user name.');
    event.preventDefault();
  }
});

$(".comment-btn").click(function(event) {
  var content = $('.comment-text').val()
  if (content.length === 0) {
    alert("Please enter some comment.");
    event.preventDefault();
  }

});

$('#edit-btn').click(function(event) {
  window.location.href = window.location.href.split('item')[0] + 'edit-item' + window.location.href.split('item')[1];
})

function getCookie(cname) {
  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

$('#want-btn').click(function(event) {
  event.preventDefault();
  var user_email = getCookie('username');
  var to_uid = $('#uid').text();
  data = {
    "user_id": user_email,
    "to_uid": to_uid
  }
  url = "https://wiqf70zw81.execute-api.us-east-1.amazonaws.com/test/createchat"
  $.ajax({
    url: url,
    crossDomain: true,
    type: "POST",
    headers: {
      'Content-Type': 'application/json'
    },
    data: JSON.stringify(data),
    dataType: "json"
  }).done(function(response) {
    chat_id = response['chat_id']
    window.location.pathname = '/chats/' + chat_id + '/0';
  });
})

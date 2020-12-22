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

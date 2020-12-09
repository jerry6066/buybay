
$("#SignUpButton").click(function (event) {
  var email = $('#SignUpEmail').val();
  var pwd = $('#SignUpPassword').val();

  if (email.length === 0) {
    alert('Please enter a valid email.');
    event.preventDefault();
  } else if (pwd.length < 8) {
    alert('Password at least 8 characters.');
    event.preventDefault();
  }
});

$("#LogInButton").click(function (event) {
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

$("#CodeButton").click(function (event) {
  var code = $('#Code').val();
  if (code.length == 0) {
    alert("Invalid code!");
    event.preventDefault();
  }
})

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


setInterval(function() {
  var num = $('.chat-block').length;
  var chat_id = window.location.href.split("chats/")[1]

  data = {
    "user_id": getCookie("username"),
  }
  $.ajax({
    url: "https://wiqf70zw81.execute-api.us-east-1.amazonaws.com/test/chats/" + chat_id + "/" + (num-1).toString(),
    crossDomain: true,
    type: "POST",
    headers: {
      'Content-Type': 'application/json'
    },
    data: JSON.stringify(data),
    dataType: "json"
  }).done(function(response) {
    chats = response['chats']
    if (chats.length > 0) {
      chats.forEach(function (chat) {
        $('#chat-'+(num-1).toString()).after("<div class='chat-block' id='chat-" + num.toString() + "'>" + "<p class='id' style='display: none;'>"+chat.id +"</p>" + "<p class='chat-time'>"+chat.time+"</p>" + "<p class='chat-username'>"+chat.sender+"</p>" + "<p class='chat-content'>"+chat.content+"</p>" + "</div>")
        num = num + 1
      })
      $(".display-chat-block").scrollTop($(".display-chat-block")[0].scrollHeight);
    }
  });

  // $('#chat-'+(num-1).toString()).after("<div class='chat-block' id='chat-" + num.toString() + "'>" + "<p class='id' style='display: none;'>no1</p>" + "<p class='chat-time'>2020-12-12 10:10</p>" + "<p class='chat-username'>Jerry</p>" + "<p class='chat-content'>Hello Hello Hello</p>" + "</div>")
  //
}, 1000);



$('#send-btn').click(function (e) {
  var value = $('.input-text')[0].value
  var chat_id = window.location.href.split("chats/")[1]
  if (value.length === 0) {
    alert("Please type something.")
    return;
  } else {
    data = {
      "user_id": getCookie("username"),
      "content": value
    }
    $.ajax({
      url: "https://wiqf70zw81.execute-api.us-east-1.amazonaws.com/test/chats/" + chat_id,
      crossDomain: true,
      type: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      data: JSON.stringify(data),
      dataType: "json"
    }).done(function(response) {
      console.log(response)
    });
  }
})

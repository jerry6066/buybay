$('.chat-block').click(function(event) {
  var chat_id = event.currentTarget.children[0].textContent;
  window.location.href += "/" + chat_id;
})

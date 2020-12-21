$('.item-card').click(function(event) {
  var item_id = event.currentTarget.children[0].textContent;

})

$('.item-card').click(function(event) {
  var item_id = event.currentTarget.children[0].textContent;
  if (event.target.id === "delete-btn" || event.target.id === "delete-i") {
    var msg = "Are you going to delete this item? "
    var r = confirm(msg);
    if (r === true) {
      window.location.href = window.location.href.split('/user')[0] + '/delete-item/' + item_id;
    }

  } else {
    window.location.href = window.location.href.split('/user')[0] + '/item/' + item_id;
  }
})

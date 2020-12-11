$('#prev-btn').click(function() {
  var prev_page = parseInt($('#page_num').text()) - 1;
  window.location.pathname = "/display/page/" + prev_page.toString();
});

$('#next-btn').click(function() {
  var prev_page = parseInt($('#page_num').text()) + 1;
  window.location.pathname = "/display/page/" + prev_page.toString();
})

$('.item-card').click(function(event) {
  var item_id = event.currentTarget.children[0].textContent;
  window.location.href = window.location.href.split('/display')[0] + '/item/' + item_id;
})

$('#prev-btn').click(function() {
  var prev_page = parseInt($('#page_num').text()) - 1;
  window.location.pathname = "/display/page/" + prev_page.toString();
});

$('#next-btn').click(function() {
  var prev_page = parseInt($('#page_num').text()) + 1;
  window.location.pathname = "/display/page/" + prev_page.toString();
})

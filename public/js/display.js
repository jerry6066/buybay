$('#prev-btn').click(function() {
  var prev_page = parseInt($('#page_num').text()) - 1;
  var keyword = $('#search-input').val();
  if (keyword.length > 0) {
    window.location.pathname = '/display/search/' + keyword + '/page/' + prev_page.toString();
  } else {
    window.location.pathname = "/display/page/" + prev_page.toString();
  }
});

$('#next-btn').click(function() {
  var prev_page = parseInt($('#page_num').text()) + 1;
  var keyword = $('#search-input').val();
  if (keyword.length > 0) {
    window.location.pathname = '/display/search/' + keyword + '/page/' + prev_page.toString();
  } else {
    window.location.pathname = "/display/page/" + prev_page.toString();
  }
})

$('.item-card').click(function(event) {
  var item_id = event.currentTarget.children[0].textContent;
  window.location.href = window.location.href.split('/display')[0] + '/item/' + item_id;
})

$('#search-btn').click(function(event) {
  var keyword = $('#search-input').val();
  if (keyword.length === 0) {
    alert("Please enter some keyword to search.");
    return;
  } else {
    window.location.pathname = "/display/search/" + keyword + "/page/1";
  }
})

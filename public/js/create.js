$('.add-para-btn').click(function(event) {
  $(".add-para-btn").before("<div class='paragraph'>" + "<textarea oninput='auto_grow(this)' class='form-control description-text' placeholder='Describe your item. The max length for one paragraph is 200 characters. You can add another paragraph.' maxlength='200'></textarea>" + "<button class='btn btn-outline-danger delete-para-btn' type='button'><i class='fas fa-trash-alt'></i></button>" + "</div>");

  $(".delete-para-btn").click(function(event) {
    event.currentTarget.parentElement.remove();
  });
});

$(".delete-para-btn").click(function(event) {
  event.currentTarget.parentElement.remove();
});

$(".add-img-btn").click(function(event) {
  $(".add-img-btn").before("<label class='img-container'>" + "<input accept='image/jpeg' type='file' class='image-input' style='display:none'>" + "<img class='item-image' src='https://buybay.s3.amazonaws.com/default/item-img-reminder.jpg'>" + "<button class='btn btn-outline-danger delete-img-btn' type='button'><i class='fas fa-trash-alt'></i></button>" + "</label>");

  $('.image-input').on('change', function(event) {
    var file = event.target.files[0];
    var reader = new FileReader();
    reader.onloadend = function() {
      event.currentTarget.parentNode.children[1].src = reader.result;
    }
    reader.readAsDataURL(file);
  });

  $(".delete-img-btn").click(function(event) {
    event.currentTarget.parentElement.remove();
  });
});

$('.image-input').on('change', function(event) {
  var file = event.target.files[0];
  var reader = new FileReader();
  reader.onloadend = function() {
    event.currentTarget.parentNode.children[1].src = reader.result;
  }
  reader.readAsDataURL(file);
});

$(".delete-img-btn").click(function(event) {
  event.currentTarget.parentElement.remove();
});

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

$(".save-btn").click(function() {
  var item_name = $('.item-name-input').val();
  if (item_name.length === 0) {
    alert("You need enter the item name.");
    return;
  }
  var price = $('.item-price-input').val();
  if (price.length === 0) {
    alert("Please enter the price.");
    return;
  }
  if (price <= 0) {
    alert("The price has to be positive.");
    return;
  }
  var main_img = $('.main_img')[0].src;
  if (main_img === "https://buybay.s3.amazonaws.com/default/item-main-img-reminder.jpg") {
    alert("You need to upload a main image.");
    return
  }

  var description = [];
  for (var i = 0; i < $('.description-text').length; i++) {
    var des = $('.description-text')[i].value;
    if (des.length > 0) {
      description.push(des)
    }
  }
  if (description.length === 0) {
    alert("Please enter some description.");
    return;
  }
  var images = [];
  for (var i = 0; i < $('.item-image').length; i++) {
    var tmp = $('.item-image')[i].src;
    if (tmp != "https://buybay.s3.amazonaws.com/default/item-img-reminder.jpg") {
      images.push(tmp);
    }
  }

  var user_id = getCookie("username");

  url = "https://wiqf70zw81.execute-api.us-east-1.amazonaws.com/test/item/"
  var root_url
  if (window.location.href.includes('edit-item')) {
    item_id = window.location.href.split('edit-item/')[1]
    root_url = window.location.href.split('edit-item/')[0]
    url = url + item_id
  } else {
    url += "0";
    root_url = window.location.href.split('create')[0]
  }

  data = {
    "user_id": user_id,
    "item_name": item_name,
    "price": price,
    "main_img_base64": main_img,
    "description": description,
    "images_base64": images
  }

  // console.log(JSON.stringify(data));
  console.log(url)
  $('.save-btn').prop('disabled', true);
  $(".save-btn").html("Submitting");
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
    $('.save-btn').prop('disabled', false);
    $(".save-btn").html("<i class='fas fa-cloud-upload-alt'></i> Submit");
    if(response['status'] === false) {
      alert(response['message'])
    } else {
      new_url = root_url + 'item/' + response['item_id']
      window.location.href = new_url;
    }
  });

})

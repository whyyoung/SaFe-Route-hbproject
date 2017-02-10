var map;
// initializes "simple" map
function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 15,
    center: {lat: 37.7749, lng: -122.4194}
  });};

// set dates for URL request from today to 3 weeks previous which will provide 
// 1 week's worth of data to map
var currentDate = new Date();
var startDate = new Date(+new Date - 1814e6);

currentDate = (currentDate.toISOString()).slice(0, 10)
startDate = (startDate.toISOString()).slice(0, 10)

function makeMarker(data) {
  $.each(data, function(i, entry) {
      var longitude = parseFloat(entry["location"]["coordinates"][0])
      var latitude = parseFloat(entry["location"]["coordinates"][1])

      var newLatlng = {lat: latitude, lng: longitude}
      // places a marker on the map at each incident location.
      var marker = new google.maps.Marker({
              position: newLatlng,
              map: map,
              title: entry["category"]
            });

      var incidentDate = entry["date"]
      incidentDate = incidentDate.slice(0, 10)

      // creates content for info window for each incident
      var contentString = '<div class="window-content">' +
            '<p><b>Category: </b>' + entry["category"] + '</p>' +
            '<p><b>Date: </b>' + incidentDate + '</p>' +
            '<p><b>Time: </b>' + entry["time"] + '</p>' +
            '<p><b>Address: </b>' + entry["address"] + '</p>' +
            '<p><b>Description: </b>' + entry["descript"] + '</p>' +
        '</div>';
      // creates content window for each map marker   
      var infowindow = new google.maps.InfoWindow({
            content: contentString
      });

      marker.addListener('click', function() {
        infowindow.open(map, marker);
      });

    });
  };

// Requests data from open source dataset to populate map markers/windows
$.get("https://data.sfgov.org/resource/cuks-n6tp.json?$where=date%20between%20%27" + 
  startDate + "T00:00:00.000%27%20and%20%27" + currentDate + 
  "T00:00:00.000%27&$$app_token={{data_key}}",
  makeMarker);

$("#submit").on('click', getDirections);

function getDirections() {
    var startAddress = document.getElementById('start-address').value;
    var endAddress = document.getElementById('end-address').value;
    var directionsService = new google.maps.DirectionsService;
    var directionsDisplay = new google.maps.DirectionsRenderer;
    directionsDisplay.setMap(map);
    directionsService.route({
      origin: startAddress,
      destination: endAddress,
      travelMode: 'WALKING'
    }, function(response, status) {
      if (status === 'OK') {
        directionsDisplay.setDirections(response);
      } else {
        window.alert('Directions request failed due to ' + status);
      }
    });
  }

// var startingPoint = {lat: 37.7749, lng: -122.4194};
// var endingPoint = {lat: 37.7749, lng: -122.4194};

// function getLocations() {
//   var startGeocoder = new google.maps.Geocoder();
//   var startAddress = document.getElementById('start-address').value;

//   startGeocoder.geocode({'address': startAddress}, function(results, status) {
//     if (status === 'OK') {
//       startingPoint = results[0].geometry.location[0];
//     } else {
//       alert('Starting address geocode was not successful for the following reason: ' + status);
//     }
//   })

//   var endGeocoder = new google.maps.Geocoder();
//   var endAddress = document.getElementById('end-address').value;

//   endGeocoder.geocode({'address': endAddress}, function(results, status) {
//     if (status === 'OK') {
//       endingPoint = results[0].geometry.location
//       console.log(endingPoint);
//     } else {
//       alert('Starting address geocode was not successful for the following reason: ' + status);
//     }
//   })
// };

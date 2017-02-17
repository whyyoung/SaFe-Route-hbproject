var map;
var markers = [];
// initializes "simple" map

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 15,
    center: {lat: 37.7749, lng: -122.4194}
  });};

initMap();

// set dates for URL request from today to 3 weeks previous which will provide 
// 1 week's worth of data to map
var currentDate = new Date();
var startDate = new Date(+new Date - 1814e6);

currentDate = (currentDate.toISOString()).slice(0, 10)
startDate = (startDate.toISOString()).slice(0, 10)
var urlStartDate = startDate + "T00:00:00.000"
var urlCurrentDate = currentDate + "T00:00:00.000"

$("#submit").on('click', getDirections);

var directionsDisplay = new google.maps.DirectionsRenderer;

function getDirections() {
    directionsDisplay.setDirections({routes: []});
    var startAddress = document.getElementById('start-address').value;
    var endAddress = document.getElementById('end-address').value;
    var directionsService = new google.maps.DirectionsService;

    directionsDisplay.setMap(map);
    directionsDisplay.setPanel(document.getElementById('right-panel'));

    directionsService.route({
      origin: startAddress,
      destination: endAddress,
      // provideRouteAlternatives: true,
      travelMode: 'WALKING'
    }, function(response, status) {
      if (status === 'OK') {
        directionsDisplay.setDirections(response);
        var walkingRoute = response.routes[0]
        makeBuffer(walkingRoute);
      } else {
        window.alert('Directions request failed due to ' + status);
      }
    });
  }

// Create buffer around walking route to filter dataset for relevant reports
function makeBuffer(route) {
  var overviewPath = route.overview_path;
  var url = "https://data.sfgov.org/resource/cuks-n6tp.json?$where="
  for (i = 0; i < overviewPath.length; i++) {
     var lat = overviewPath[i].lat();
     var lng = overviewPath[i].lng();
     if (i < (overviewPath.length) - 1){
      url = url + "within_circle(location,%20" + lat + ",%20" + lng + ",%20100)%20OR%20";
    } else {
      url = url + "within_circle(location,%20" + lat + ",%20" + lng + ",%20100)&$order=date%20DESC&$limit=100"; 
    }
  }

  $.get(url, filterByDate);
}

// Requests data from open source dataset to populate map markers/windows
function filterByDate(results) {
  var dateFiltered = []
  $.each(results, function(i, entry) {
      var comparisonDate = urlStartDate;
      var incidentDate = entry["date"]
      incidentDate = Date.parse(incidentDate);
      comparisonDate = Date.parse(comparisonDate);
      if (comparisonDate < incidentDate) {
        dateFiltered.push(entry)
      }
    });

  makeMarker(dateFiltered);
}


function makeMarker(data) {

  function setMapOnAll(map) {
    for (var i = 0; i < markers.length; i++) {
      markers[i].setMap(map);
    }
  }

  function deleteMarkers(){
    setMapOnAll(null);
    markers = [];
  }

  if (markers != null) {
    deleteMarkers();
  };

  $.each(data, function(i, entry) {
      var longitude = parseFloat(entry["location"]["coordinates"][0])
      var latitude = parseFloat(entry["location"]["coordinates"][1])

      var newLatlng = {lat: latitude, lng: longitude}

      var image = {
        url: 'static/unicorn.png',
        size: new google.maps.Size(75, 75),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(17, 34),
        scaledSize: new google.maps.Size(40,40)
      };
      // places a marker on the map at each incident location.
      var marker = new google.maps.Marker({
              position: newLatlng,
              map: map,
              title: entry["category"],
              icon: image
            });
      markers.push(marker);

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



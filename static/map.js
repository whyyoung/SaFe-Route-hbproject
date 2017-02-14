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

      var image = {
        url: 'static/unicorn.png',
        size: new google.maps.Size(85, 85),
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

// $("div.adp.list").on('click', function(){
//   console.log(response.routes[0].legs[0].steps[0].start_location);
//   console.log(response.routes[0].legs[0].steps[0].end_location);
// })

function getDirections() {
    var startAddress = document.getElementById('start-address').value;
    var endAddress = document.getElementById('end-address').value;
    var directionsService = new google.maps.DirectionsService;
    var directionsDisplay = new google.maps.DirectionsRenderer;

    // var control = document.getElementById('floating-panel');
    //     control.style.display = 'block';
    //     map.controls[google.maps.ControlPosition.TOP_CENTER].push(control);

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
        
        // var stepsArray = response.routes[0].legs[0].steps;
        
        // var originLatLng = {lat: stepsArray[0].start_point.lat(), 
        //   lng: stepsArray[0].start_point.lng()};

        // var remainingLatLng = stepsArray.map(function(x){
        //   return {lat: x.end_point.lat(), lng: x.end_point.lng()}
        // });

        // var stepsLatLng = {startBoundary: originLatLng,
        //                     boundaryPoints: remainingLatLng}

        // debugger;
        // $.get("/turn-locations.json", stepsLatLng, function(){
        //   alert("I'm back!");
        // });
      } else {
        window.alert('Directions request failed due to ' + status);
      }
    });
  }

// Create buffer around walking route to filter dataset for relevant reports
function makeBuffer(route) {
  var overviewPath = route.overview_path,
      overviewPathGeo = [];
  for(var i = 0; i < overviewPath.length; i++) {
      overviewPathGeo.push(
          [overviewPath[i].lng(), overviewPath[i].lat()]
      );
  }
  var distance = 1/1380, // Roughly 0.05mi (length of one city block)
      geoInput = {
          type: "LineString",
          coordinates: overviewPathGeo
      };
  var geoReader = new jsts.io.GeoJSONReader(),
      geoWriter = new jsts.io.GeoJSONWriter();
  var geometry = geoReader.read(geoInput).buffer(distance);
  var polygon = geoWriter.write(geometry);

  var oLanLng = [];
  var oCoordinates;
  oCoordinates = polygon.coordinates[0];
  for (i = 0; i < oCoordinates.length; i++) {
     var oItem;
     oItem = oCoordinates[i];
     oLanLng.push(new google.maps.LatLng(oItem[1], oItem[0]));
  }

  var polygone = new google.maps.Polygon({
      paths: oLanLng,
      map:map
  });

  console.log(polygon.coordinates[0]);
}
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

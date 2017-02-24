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

$("#submit").on('click', getDirections);
// $("#submit").on('click', updateDatabase);

var walkingRouteStored = []
var directionsDisplay = new google.maps.DirectionsRenderer;
// Takes a starting address and an ending address to build a visual walking route
// on the map as well as written step-by-step directions to the right of the map.
// When called, the old route with corresponding markers are removed to prepare the
// map for a new route and set of corresponding markers/crime incidents.
function setMapOnAll(map) {
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(map);
  }
}

function deleteMarkers(){
  setMapOnAll(null);
  markers = [];
}


function getDirections() {

    if (markers != null) {
      deleteMarkers();
    };

    directionsDisplay.setDirections({routes: []});
    var startAddress = document.getElementById('start-address').value;
    var endAddress = document.getElementById('end-address').value;
    var directionsService = new google.maps.DirectionsService;

    directionsDisplay.setMap(map);
    directionsDisplay.setPanel(document.getElementById('right-panel'));

    directionsService.route({
      origin: startAddress,
      destination: endAddress,
      provideRouteAlternatives: true,
      travelMode: 'WALKING'
    }, function(response, status) {
      if (status === 'OK') {
        directionsDisplay.setDirections(response);
        var walkingRoute = response.routes[0].overview_path;
        makeBuffer(walkingRoute);  

        for(var i in response.routes) {
            // var line = new google.maps.Polyline({
            //   path: walkingRoute,
            //   strokeColor: "FFEE00",  // you might want different colors per suggestion
            //   strokeOpacity: 0.7,
            //   strokeWeight: 3
            // });
            // line.setMap(map);
            var obj = {};
            obj[i] = response.routes[i].overview_path;
            walkingRouteStored.push(obj);


            // var line = drawPolyline(response.routes[i].overview_path, '#0000ff', hide);
            // polylines.push(line);
            // shadows.push(shadow);
            // // let's add some data for the infoWindow
            // data.push({
            //     distance: response.routes[i].legs[0].distance,
            //     duration: response.routes[i].legs[0].duration,
            //     end_address: response.routes[i].legs[0].end_address,
            //     start_address: response.routes[i].legs[0].start_address,
            //     end_location: response.routes[i].legs[0].end_location,
            //     start_location: response.routes[i].legs[0].start_location
            // });
            // bounds = line.getBounds(bounds);
            // google.maps.event.addListener(shadow, 'click', function(e) {
            //     // detect which route was clicked on
            //     var index = shadows.indexOf(this);
            //     highlightRoute(index, e);
            }
          }

        });
        // directionsDisplay.setDirections(response);
                        // document.getElementsByClassName('adp-listinfo').addEventListener('click', alert("it worked!"));
                      //   var onChangeHandler = function() {
                      //     calculateAndDisplayRoute(directionsService, directionsDisplay);
                      //   };
                      //   document.getElementById('start').addEventListener('change', onChangeHandler);
                      //   document.getElementById('end').addEventListener('change', onChangeHandler);
                      // }
      //   var walkingRoute = response.routes[0]
      //   makeBuffer(walkingRoute);
      // } else {
      //   window.alert('Directions request failed due to ' + status);
      // }

    // });
  debugger;
  }
// document.querySelector('body').addEventListener('click', function(event) {
//   if (event.target.tagName.toLowerCase() === 'td') {

//   console.log("hi");
// }
// });

$('#right-panel').on('DOMNodeInserted', function(){
  $("td").on('click', function(){
    var x = this.dataset.routeIndex;
    var newMarkers = walkingRouteStored[x];
    if (markers != null) {
      deleteMarkers();
    };
    makeBuffer(newMarkers[x]);
    debugger;
  })
});


// Creates url data get request to filter relevant crime incidents within 100 meters radius of
// points along a given route (provided by Goggle Maps API). The request also filters
// the data to provide reports made during the most current week available. Data received
// is passed to makeMarkers function to place markers where incidents have occurred.
function makeBuffer(route) {
  var overviewPath = route;
  for (i = 0; i < overviewPath.length; i++) {
     var lat = overviewPath[i].lat();
     var lng = overviewPath[i].lng();
     var url = "https://data.sfgov.org/resource/cuks-n6tp.json?$where=within_circle(location,%20" + lat + ",%20" + lng + ",%20100)%20AND%20date%20between%20%27" + 
      startDate + "T00:00:00.000%27%20and%20%27" + currentDate + "T00:00:00.000%27";

      $.get(url, makeMarker); 
    }
  }

  // $.get(url, filterByDate);
// }

// Requests data from open source dataset to populate map markers/windows
// (NO LONGER RELEVANT)
// function filterByDate(results) {
//   var dateFiltered = []
//   $.each(results, function(i, entry) {
//       var comparisonDate = urlStartDate;
//       var incidentDate = entry["date"]
//       incidentDate = Date.parse(incidentDate);
//       comparisonDate = Date.parse(comparisonDate);
//       if (comparisonDate < incidentDate) {
//         dateFiltered.push(entry)
//       }
//     });

//   makeMarker(dateFiltered);
// }

// Receives relevant crime data from makeBuffer function. Parses the data received
// to extract location for the marker along with information needed to populate the
// info window pop-up upon marker click. Sets the markers onto the map, attaches info
// window to each marker along with a listener to call the window.
function makeMarker(data) {
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
              // icon: image
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
        // setTimeout(function () { infowindow.close(); }, 5000);
      });

    });
  };



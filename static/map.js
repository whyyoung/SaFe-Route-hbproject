var map;
var markers = [];
var walkingRouteStored = [];

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
var startDate = new Date(+new Date - 2419e6);

currentDate = (currentDate.toISOString()).slice(0, 10)
startDate = (startDate.toISOString()).slice(0, 10)

$("#submit").on('click', getDirections);
// $("#submit").on('click', updateDatabase);

// When called, removes any markers on the page for the existing route to prepare the
// map for a new route and set of corresponding markers/crime incidents.
function setMapOnAll(map) {
  if (markers != null) {
    for (var i = 0; i < markers.length; i++) {
      markers[i].setMap(map);
    }
  }
}

function deleteMarkers(){
  setMapOnAll(null);
  markers = [];
}

var directionsDisplay = new google.maps.DirectionsRenderer;
// Takes a starting address and an ending address to build a visual walking route
// on the map as well as written step-by-step directions to the right of the map.
function getDirections() {
    walkingRouteStored = []

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
            var obj = {};
            obj[i] = response.routes[i].overview_path;
            walkingRouteStored.push(obj);
            }


          }

        });

    var nowDateTime = new Date()
    nowDateTime = nowDateTime.toISOString()

    var searchInfo = {
      "start": startAddress,
      "end": endAddress,
      "routes": walkingRouteStored,
      "datestamp": nowDateTime
    };
    setTimeout(function() {
      $.ajax({
      url:'/store-searches.json',
      type: "POST",
      data: JSON.stringify(searchInfo),
      contentType: "application/json; charset=utf-8",
      success: function(){}
      });
      getLyftInfo();
    }, 2000);

    function getLyftInfo(){
      // var startAddress = document.getElementById('start-address').value;
      // var endAddress = document.getElementById('end-address').value;
      var routeLatLng = walkingRouteStored[0][0];
      var end_point = routeLatLng.length - 1

      var start_lat = routeLatLng[0].lat()
      var start_lng = routeLatLng[0].lng()
      var end_lat = routeLatLng[end_point].lat()
      var end_lng = routeLatLng[end_point].lng()

      var data = {"startAddress": startAddress,
                  "endAddress": endAddress,
                  "start_lat": start_lat,
                  "start_lng": start_lng,
                  "end_lat": end_lat,
                  "end_lng": end_lng}

      $.post("/get_lyft_info", data, displayLyftInfo);

      function displayLyftInfo(results){
        // alert("You have successfully requested a Lyft and a driver is on the way!");
        console.log(results);
      };
    }
  };

var click_event_tracker = false;

$('#right-panel').on('DOMNodeInserted', function(){
  $('td').on('click', function(){
    if (click_event_tracker == false) {
      var x = this.dataset.routeIndex;
      var newMarkers = walkingRouteStored[x];
      makeBuffer(newMarkers[x]);
      click_event_tracker = true;
    }
  })
});


// Creates url data get request to filter relevant crime incidents within 100 meters radius of
// points along a given route (provided by Goggle Maps API). The request also filters
// the data to provide reports made during the most current week available. Data received
// is passed to makeMarkers function to place markers where incidents have occurred.
function makeBuffer(route) {
  // var overviewPath = route;
  deleteMarkers();
  for (i = 0; i < route.length; i++) {
     var lat = route[i].lat();
     var lng = route[i].lng();
     var url = "https://data.sfgov.org/resource/cuks-n6tp.json?$where=within_circle(location,%20" + lat + ",%20" + lng + ",%20100)%20AND%20date%20between%20%27" + 
      startDate + "T00:00:00.000%27%20and%20%27" + currentDate + "T00:00:00.000%27%20AND%20category%20" + 
      "in('ASSAULT',%20'ROBBERY',%20'KIDNAPPING',%20'SEX%20OFFENSES,%20NON%20FORCIBLE',%20'SEX%20OFFENSES,%20FORCIBLE',%20'PROSTITUION',%20'PORNOGRAPHY/OBSCENE%20MAT')" +
      "&$$app_token=NbDmHMnJDPXxi9GKVUV73Kt8t";

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
  click_event_tracker = false;
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
        setTimeout(function () { infowindow.close(); }, 5000);
      });

    });
  };

// $('#lyft').on('click', requestLyft);





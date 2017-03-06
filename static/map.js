var map;
var markers = [];
var walkingRouteStored = [];

// initializes "simple" map
function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 15,
    center: {lat: 37.7749, lng: -122.4194}
  });
  $('#lyft-request').hide();};

initMap();

// set dates for URL request from today to 3 weeks previous which will provide 
// 1 week's worth of data to map
var currentDate = new Date();
var startDate = new Date(+new Date - 1814e6);

currentDate = (currentDate.toISOString()).slice(0, 10)
startDate = (startDate.toISOString()).slice(0, 10)

$("#get-directions").on('click', getDirections);
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
var confirmWindowSeen = false;

// Takes a starting address and an ending address to build a visual walking route
// on the map as well as written step-by-step directions to the right of the map.
function getDirections() {
  if (document.getElementById('start-address').value == "None") {
    $("#start-address").attr("value", "Starting Address")
    $("#end-address").attr("value", "Destination Address")
  // } else if (document.getElementById('lyft-called').value == "True") {
  //   var urlWithCode = {"url": 'SANDBOX-' + window.location.href};
  //   debugger;
  //   $.post('/lyft-request', urlWithCode, function(response) {
  //       if (response == "OK") {
  //         alert("You have successfully requested a Lyft and a driver is on the way.");        
  //       }
  //     });
    // } else {
    //   confirmWindowSeen = true;
    //   $.post('/lyft-request-code.json', urlWithCode, function(){
    //   alert("Although you have not requested a Lyft at this time, SaFe Route is authorized to request one for you within the next hour.")
    //   });
    // }
  } else {
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
      createLegend();
    }, 3000);

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
      $('p').empty();
      $.post("/get_lyft_info", data, displayLyftInfo);

      function displayLyftInfo(results){
        var minutes = Math.floor(results.eta_seconds/60);
        var seconds = results.eta_seconds - minutes * 60;
        var maxDollars = results.estimated_cost_cents_max / 100;
        var minDollars = results.estimated_cost_cents_min / 100;

        maxDollars.toLocaleString("en-US", {style:"currency", currency:"USD"});
        minDollars.toLocaleString("en-US", {style:"currency", currency:"USD"});
        // alert("You have successfully requested a Lyft and a driver is on the way!");
        $('p').html("ETA: " + minutes + "min, " + seconds + "sec" + "<br>" +
                    "Cost: $" + minDollars + " - $" + maxDollars)
        $('#lyft-request').toggle();
      };
    }
  };}

getDirections();

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
      startDate + "T00:00:00.000%27%20and%20%27" + currentDate + "T00:00:00.000%27&$$app_token=NbDmHMnJDPXxi9GKVUV73Kt8t"
      // "%20AND%20category%20in('ASSAULT',%20'ROBBERY',%20'KIDNAPPING',%20'SEX%20OFFENSES,%20NON%20FORCIBLE',%20'SEX%20OFFENSES,%20FORCIBLE',%20'PROSTITUION',%20'PORNOGRAPHY/OBSCENE%20MAT')";

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
var icons = {
    assault: {
      name: 'Assault',
      icon: 'static/images/yellow_MarkerA.png'
    },
    robbery: {
      name: 'Robbery',
      icon: 'static/images/brown_MarkerR.png'
    },
    kidnapping: {
      name: 'Kidnapping',
      icon: 'static/images/purple_MarkerK.png'
    },
    sex: {
      name: 'Sex Crimes',
      icon: 'static/images/blue_MarkerS.png'
    }
  };

function createLegend(){
  // debugger;
  if (document.getElementById('legend').style[0] != "z-index") {
  //   $("#legend").attr("value", "True")
    var legend = document.getElementById('legend');
    for (var key in icons) {
        var type = icons[key];
        var name = type.name;
        var icon = type.icon;
        var div = document.createElement('div');
        div.innerHTML = '<img src="' + icon + '"> ' + name;
        legend.appendChild(div);
      }
    map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(legend);
  };
};

// Receives relevant crime data from makeBuffer function. Parses the data received
// to extract location for the marker along with information needed to populate the
// info window pop-up upon marker click. Sets the markers onto the map, attaches info
// window to each marker along with a listener to call the window.
function makeMarker(data) {
  click_event_tracker = false;
  var imageS = {
    url: 'static/images/blue_MarkerS.png',
    // size: new google.maps.Size(50, 50),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(17, 34),
    // scaledSize: new google.maps.Size(30,30)
  };

  var imageA = {
    url: 'static/images/yellow_MarkerA.png',
    // size: new google.maps.Size(50, 50),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(17, 34),
    // scaledSize: new google.maps.Size(30,30)
  };

  var imageK = {
    url: 'static/images/purple_MarkerK.png',
    // size: new google.maps.Size(50, 50),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(17, 34),
    // scaledSize: new google.maps.Size(30,30)
  }

  var imageR = {
    url: 'static/images/brown_MarkerR.png',
    // size: new google.maps.Size(50, 50),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(17, 34),
    // scaledSize: new google.maps.Size(30,30)
  }

  $.each(data, function(i, entry) {
      var longitude = parseFloat(entry["location"]["coordinates"][0])
      var latitude = parseFloat(entry["location"]["coordinates"][1])
      var category = entry["category"]

      var newLatlng = {lat: latitude, lng: longitude}

      // places a marker on the map at each incident location. Personal Crimes have customized markers.
      if (category == "ASSAULT") {
        var marker = new google.maps.Marker({
              position: newLatlng,
              map: map,
              title: entry["category"],
              icon: imageA,
            });
        markers.push(marker);
      } else if (category == "ROBBERY") {
        var marker = new google.maps.Marker({
              position: newLatlng,
              map: map,
              title: entry["category"],
              icon: imageR
            });
        markers.push(marker);
      } else if (category == "KIDNAPPING") {
        var marker = new google.maps.Marker({
              position: newLatlng,
              map: map,
              title: entry["category"],
              icon: imageK
            });
        markers.push(marker);
      } else if (category == ("SEX OFFENSES, NON FORCIBLE", "SEX OFFENSES, FORCIBLE", "PROSTITUION")) {
        var marker = new google.maps.Marker({
              position: newLatlng,
              map: map,
              title: entry["category"],
              icon: imageS
            });
        markers.push(marker);
      } else {
        var marker = new google.maps.Marker({
                position: newLatlng,
                map: map,
                title: entry["category"],
                // icon: image
              });
        markers.push(marker);
      };

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

// function lyftRequest(){
//   $.post('/lyft-request', function() {
//   alert("You have successfully requested a Lyft!");
//   });
// };

function lyftAuthorization(){
  // if (document.getElementById('lyft-called').value == "False") {
    // $.get('/lyft-authorization.json', function(){
    //   confirmWindowSeen = false;
      alert("You are being redirected to Lyft's website.");
      window.location.replace("https://ride.lyft.com");
      // window.location.replace("https://api.lyft.com/oauth/authorize?scope=profile+offline+rides.read+public+rides.request&state=IEKGRItbhBWkY4OevuoW4WTs2iFQjudC&response_type=code&client_id=MY8ON6erEeyi");
    // });
  // } else {
  //   lyftRequest();
  // }
};

$('#lyft-request').on('click', lyftAuthorization);





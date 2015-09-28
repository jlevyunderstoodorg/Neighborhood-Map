"use strict";

// Global variables
var infowindow;
var map;
var marker;
var center;
var placeList;

// Used to store pins on map
var mapPins = [];

/**** DATA ****/
var placeList = [
    {
      name: 'Metropolitan Museum of Art',
      lat: 40.7794366,
      lng: -73.963244,
      markerNum: 0
    },
    {
      name: 'Central Park Zoo',
      lat: 40.767778,
      lng: -73.9718335,
      markerNum: 1
    },
    {
      name: 'Museum of Modern Art',
      lat: 40.7614327,
      lng: -73.9776216,
      markerNum: 2
    },
    {
      name: 'Empire State Building',
      lat: 40.7484404,
      lng: -73.9856554,
      markerNum: 3
    },
    {
      name: 'Madison Square Garden',
      lat: 40.7505045,
      lng: -73.9934387,
      markerNum: 4
    },
    {
      name: 'Shake Shack',
      lat: 40.7414492,
      lng: -73.9882046,
      markerNum: 5
    },
];

/**** GOOGLE MAPS ****/
 function initMap() {
  // Map options centered on manhattan
  center = new google.maps.LatLng(40.759976, -73.9799772);
  var mapOptions = {
    zoom: 13,
    center: center
  };

  // assign Google Map to map view
  map = new google.maps.Map(document.getElementById('map-view'), mapOptions);

  // Google Map infowindow
  infowindow = new google.maps.InfoWindow();
    var infowindowContent = '<div class="window-title">%title%</div>';

  // setting marker and placelist name
  for (var i = 0; i < placeList.length; i++) {
    marker = new google.maps.Marker({
      position: new google.maps.LatLng(placeList[i].lat, placeList[i].lng),
      map: map,
      title: placeList[i].name
    });

    // click handler for Google Maps markers
    google.maps.event.addListener(marker, 'click', (function(marker) {
      return function() {

        // set and open the content within the infowindow
        infowindow.setContent(infowindowContent.replace('%title%', marker.title)+"<div id='content'></div>");
        infowindow.open(map, marker);

        // center, move and zoom in on the clicked marker
        center = marker.getPosition();
        map.panTo(center);
        map.setZoom(15);

        // when marker or placelist item is clicked marker will bounce twice and then stop
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function(){ marker.setAnimation(null); }, 1450);
       
        // call to get the foursquare information available for the marker and set it in the infowindow
        getFourSquare(marker);
      };
    })(marker));
  
    // Keeps map centered when window is resized
    google.maps.event.addDomListener(window, "resize", function() {
      map.setCenter(center);
    });
  
    // Adds pins to mapPins array
    mapPins.push(marker);
  }
};

/**** VIEWMODEL ****/
var ViewModel = function(){
  var self = this;
  
  self.placeList = ko.observableArray(placeList);
  self.mapPins = ko.observableArray(mapPins);
  self.filter = ko.observable('');
  self.shouldShowListings = ko.observable(false),

  // When list is display infowindow
  self.viewInfoWindow= function(placeList){
    // center, move and zoom in on the clicked marker
    var point = mapPins[placeList.markerNum];
    center = point.getPosition();
    map.panTo(center);
    map.setZoom(15);

    // set and open the content within the infowindow
    var infowindowContent = '<div class="window-title">%title%</div>';
    infowindow.open(map, point);
    infowindow.setContent(infowindowContent.replace('%title%', point.title)+"<div id='content'></div>");

    // when marker or placelist item is clicked marker will bounce twice and then stop
    point.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function(){ point.setAnimation(null); }, 1450);

    // Get info for selected listitem from Foursquare
    getFourSquare(point);
  };
  
  // filter the marker pins to display
  self.filterMarkers= function(locations){
    for (var i = 0; i < mapPins.length; i++) {
      mapPins[i].setMap(locations);
    }
  };
  // filter when user is searching via text box
  self.filterArray = function(filter){
    return ko.utils.arrayFilter(self.placeList(), function(location) {
      return location.name.toLowerCase().indexOf(filter) >= 0;
    });
  };
  
  // Display places that match text in search box
  self.showSelected = function(queriedmarkers){
    for (var i = 0; i < queriedmarkers.length; i++) {
      mapPins[queriedmarkers[i].markerNum].setMap(map);
    }
  };
  
  // Update the display of the place list
  self.filterList = function(){
    var filter = self.filter().toLowerCase();
    // If theres no current filter: display all places
    if (!filter) {
      self.filterMarkers(map);
      return self.placeList();
    }
    // If filter is on display only places that match search query
    else {
      self.filterMarkers(null);
      var queriedmarkers = [];
      queriedmarkers = self.filterArray(filter);
      self.showSelected(queriedmarkers);
      return queriedmarkers;
    }
  };
};

// Show Foursquare info in infowindow when listview or pin is selected
// API function referenced here: https://developer.foursquare.com/start/search
var getFourSquare = function(marker){
  var CLIENT_ID = 'XPHILZ4R4QLJAGFB5HTHQXMDJPETX5A3U2JRQOO5XLLWGFY5';
  var CLIENT_SECRET = 'NQVKNFE1SGU23IAIYCVF2DSVA1OZA4ZOB41EIXT5R0RB2IYJ';
  var lat= marker.position.lat();
  var lng = marker.position.lng();
  var $windowContent = $('#content');
  var url = 'https://api.foursquare.com/v2/venues/search?' + 
            'client_id=' + CLIENT_ID +
            '&client_secret=' + CLIENT_SECRET +
            '&v=20130815' + 
            '&ll=' + lat + ',' + lng + 
            '&query=\'' + marker.title + '\'&limit=1';

  // Pull foursquare info (specifically, Phone, Twitter, Facebook and Website info) from marker passed to getFourSquare function
  $.getJSON(url, function(response){
    var venue = response.response.venues[0];
    var venuePhone = venue.contact.formattedPhone;
    var venueTwitter = venue.contact.twitter;
    var venueFacebook = venue.contact.facebookName;
    var venueUrl = venue.url;
    
    // Append foursquare info to infowindow
    $windowContent.append('<p><strong>Phone:</strong> '+ venuePhone + '</p>');
    $windowContent.append('<p><strong>Twitter:</strong> @'+ venueTwitter + '</p>');
    $windowContent.append('<p><strong>Facebook:</strong> '+ venueFacebook + '</p>');
    $windowContent.append('<p><strong>Website:</strong> '+ venueUrl + '</p>');
   })
  // text warning if no information is pulled in from FOURSQUARE
  .error(function(e){
    $windowContent.text('No location info found for place.');
  });
};

// Initialize the ViewModel by using knockout
ko.applyBindings(new ViewModel());
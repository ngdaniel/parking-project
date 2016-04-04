// String format to work somewhat like pythons print formatter
String.prototype.format = function() {
  var i = 0,
    args = arguments;
  return this.replace(/{}/g, function() {
    return typeof args[i] != 'undefined' ? args[i++] : '';
  });
};

  var map;
//On document creation adds click event handler to forms
$(function() {
    ///////////////////////////////////////////////////////////////////////////////
  var directionsService;
  var markersList = [];
  var infoWindowList = [];
  var destination = {
    lat: 47.60801,
    lng: -122.335167
  };
  var nearestPayStation;
  var nearestPayStationID;
  var gpsLat;
  var gpsLng;
  var searchRadius = parseInt($("#searchRadius").val());
   $("#curRadius").html(searchRadius);
  var autoSrc;
  var autoDst;
  var polylineList = [];
  var detailsPanel = $("#directions_panel");
  var summaryPanel = $("#summary_panel");
  var originSpot;
  var destinationSpot;
 
  //Creates map over seattle and adds click dlistener
  window.initMap = function() {
    directionsService = new google.maps.DirectionsService();
    map = new google.maps.Map(document.getElementById('map'), {
      center: {
        lat: 47.60801,
        lng: -122.335167
      },
      //zoom: 12,//see entire city
      zoom: 15, //see middle of downtown
      disableDefaultUI: true,
      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.TOP_RIGHT
      },
    });

    map.addListener('click', function(e) {
      placeMarkerAndFindPayStations(e.latLng, map);
    });

    autoSrc = new google.maps.places.Autocomplete( /** @type {!HTMLInputElement} */ (document.getElementById("dirSrc")));
    autoDst = new google.maps.places.Autocomplete( /** @type {!HTMLInputElement} */ (document.getElementById("dirDst")));

    //Grab location from Source Auto Search when changed
    autoSrc.addListener('place_changed', function() {
        var place = autoSrc.getPlace();
        if (!place.geometry) {
          window.alert("Autocomplete's returned place contains no geometry");
          return;
        }else{
            console.log(place);
            originSpot = place['formatted_address'];
        }
    });
    

    //Grab location from Destination Auto Search when changed
    autoDst.addListener('place_changed', function() {
            var place = autoDst.getPlace();
            if (!place.geometry) {
              window.alert("Autocomplete's returned place contains no geometry");
              return;
            }else{
                console.log(place);
                destinationSpot = place['formatted_address'];
            }
        });
    $('#gps').bind('click', function() {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(function(data) {
            originlat = data.coords.latitude;
            originlng = data.coords.longitude;
            originSpot = new google.maps.LatLng(originlat,originlng);
            $("#dirSrc").val(data.coords.latitude + ','+ data.coords.longitude);
        });
        } else {
          alert("Geolocation is not supported by this browser.");
        }
        return false;
      });

    $("#searchRadius").change( function(){
        searchRadius = parseInt($(this).val()); 
        $("#curRadius").html(searchRadius);
        console.log("search radius =" + searchRadius);
    });

    //Checks which boxes are checked and takes the destination and source
    //If they are filled out , then directions will be drawn
    $('#routeToLocation').bind('click', function() {
        clearMap();
         directionsExp(directionsService,originSpot,destinationSpot);
        
        });

      var polyline = new google.maps.Polyline({
         path: [],
         geodesic: true,
         strokeColor: '#FF0000',
         strokeOpacity: 1.0,
         strokeWeight: 2
       });      
          function directionsExp(directionsService,originSpot,destSpot){
          directionsService.route({
                origin: originSpot,
                destination: destSpot,
                travelMode: google.maps.TravelMode.DRIVING,
                drivingOptions:{
                    trafficModel:google.maps.TrafficModel.BEST_GUESS,
                    departureTime: new Date(Date.now() ), 
                    
                },
                provideRouteAlternatives:true
            },  
            function (response,status){
                if (status == google.maps.DirectionsStatus.OK) {
                    console.log(response)
                    var bounds = new google.maps.LatLngBounds();
                    var summaryList = [];
                    var detailsList = [];
                    var startLocation = new Object();
                    var endLocation = new Object();
                    var routeList = [];
                    clearDirectionsPanel();   
                    //do route logic here and loop over the route array
                    $.each(response.routes, function(index, routeOption){
                        routeList.push(routeOption); 
                    });
                     console.log(routeList); 
                    
                    $.each(routeList, function(index,route){
                        console.log(route);
                        //Route Summary at the top of the page
                        var $div = $("<div>",{id :"foo", class : "directionsBox"});
                        $div.data("directions",index);
                        
                        //show route information associated when div clicked on 
                        $div.click(function(){
                            clearPolyLines();
                            directionsNumber = jQuery(this).data('directions');
                            detailsPanel.html(detailsList[directionsNumber].html());
                            polylineList[directionsNumber].setMap(map);
                       });

                       $.each(route.legs, function(routeNumber,routeSegment){
                            if (index == 0){
                                var $fromAndTo = $("<div>");
                                $fromAndTo.append( routeSegment.start_address + " to ");
                                $fromAndTo.append( routeSegment.end_address + "<br />");
                                summaryPanel.append($fromAndTo);
                            }
                            $div.append( "<b>Route: " + (index + 1) +" -  Via:"+ route.summary + " - " + routeSegment.distance.text+' '+ routeSegment.duration.text+ "</b><br />");
                      });
                       //storing the divs inside an array to mess with later
                    summaryList[index] = $div
                    summaryPanel.append($div);


                    //Pathing
                        var path = route.overview_path;
                        var legs = route.legs;
                        var $directions = $("<div>",{id :"foo", class : "fee"});
                        $directions.append("<ul>");
                        $div.click(function(){
                        //hide the other content
                        //s
                        });
                        for (i=0;i<legs.length;i++) {
                            if (i == 0) { 
                                startLocation.latlng = legs[i].start_location;
                                startLocation.address = legs[i].start_address;
                                startLocation.marker = createMarker(legs[i].start_location,"start",legs[i].start_address,"green");
                            }
                             endLocation.latlng = legs[i].end_location;
                             endLocation.address = legs[i].end_address;
                             var steps = legs[i].steps;
                            var polyline = new google.maps.Polyline({
                                 path: [],
                                 geodesic: true,
                                 strokeColor: '#FF0000',
                                 strokeOpacity: 1.0,
                                 strokeWeight: 2
                               }); 
                             for (j=0;j<steps.length;j++) {
                                 var nextSegment = steps[j].path;
                                 $directions.append( "<li>"+steps[j].instructions);
                                 var dist_dur = "";
                                 if (steps[j].distance && steps[j].distance.text) dist_dur += "&nbsp;"+steps[j].distance.text;
                                 if (steps[j].duration && steps[j].duration.text) dist_dur += "&nbsp;"+steps[j].duration.text;
                                 if (dist_dur != "") {
                                     $directions.append( "("+dist_dur+")<br /></li>");
                                 } else {
                                     $directions.append( "</li>");
                                 }

                                 for (k=0;k<nextSegment.length;k++) {
                                     polyline.getPath().push(nextSegment[k]);
                                     bounds.extend(nextSegment[k]);
                                 }
                              }
                        }
                        $directions.append("</ul>");
                        detailsList[index] = $directions;  
                        polylineList[index] = polyline; 
                        map.fitBounds(bounds);
                        endLocation.marker = createMarker(endLocation.latlng,"end",endLocation.address,"red");
        
                    })   
                }else alert(status);
            })
   }



  function createMarker(placement,title,adress,color){
    var marker = new google.maps.Marker({
        position: placement,
        map: map,
        icon:'http://maps.google.com/mapfiles/ms/icons/'+color+'-dot.png'  ,
        title:title 
      });
      markersList.push(marker);
  
  }
        //Gets data points from library and plots the markers
    //radius is gotten from textBox, default is 250m
    function placeMarkerAndFindPayStations(latLng, map) {
      clearMap();
      //Queries python API for datapoints
      $.getJSON($SCRIPT_ROOT + '/paystations_in_radius', {
        latitude: latLng.lat,
        longitude: latLng.lng,
        radius: searchRadius/1000
      }, function(data) {
        // console.log(data);
        markAndCircle(latLng, searchRadius, map);
        //Loop over each datapoint(payStation)
        nearestPayStation = null;
        $.each(data, function(index) {
          payStationItem = data[index];
          // console.log(payStationItem);
          idNumber = index;
          meterLat = payStationItem[5];
          meterLong = payStationItem[4];
          meterMaxOcc = payStationItem[6];
          distance = payStationItem[7];
          if (nearestPayStation === null) {
            nearestPayStation = payStationItem;
            nearestPayStationID = idNumber;
          } else if (nearestPayStation[7] > distance) {
            console.log(distance);
            nearestPayStation = payStationItem;
            nearestPayStationID = idNumber;
          }
          //Adds marker and infowindow  + click listners for each payStation
          var marker = new google.maps.Marker({
            position: new google.maps.LatLng(meterLat, meterLong),
            map: map,
            icon: $SCRIPT_ROOT + '/static/parkingBlue.png'
              //have different colored parking .png files for busy/notbusy/somewhat busy
          });
          //TODO: Make a better looking Info window
          infoWindowContent = '<p>parkingMeter {} has a max capacity {} and is {} km away from destination </p>'.format(idNumber, meterMaxOcc, distance);
          var infoWindow = new google.maps.InfoWindow({
            content: infoWindowContent
          });
          marker.addListener('click', function() {
            for (var i = 0; i < infoWindowList.length; i++) {
              infoWindowList[i].close();
            }
            infoWindow.open(map, marker);
          });
          markersList.push(marker);
          infoWindowList.push(infoWindow);

        });
        destinationSpot = new google.maps.LatLng(nearestPayStation[5],nearestPayStation[4])
        
        //console.log(nearestPayStation[4]);
      });
      return false;
    }

	// Clears the map of markers
	function clearMap() {
      //  clearLines();	
	    clearMarkers();
	    clearPolyLines();
        polylineList = [];
        infoWindowList = [];
	}
    // Make directions empty again 
      function clearDirectionsPanel(){
            summaryPanel.html('') ;
            detailsPanel.html('');
      }
    function clearMarkers(){
        for (var i = 0; i < markersList.length; i++) {
                markersList[i].setMap(null);
            }
		markersList = [];
    }

    function clearPolyLines(){
        for (var j = 0; j < polylineList.length; j++) {
                polylineList[j].setMap(null);
            }
    }

    //takes a latLong object , radius , and map
    //draws a maker and circle around point
    function markAndCircle(searchCoord, searchRadius, map) {
      var marker = new google.maps.Marker({
        position: searchCoord,
        map: map,
      });
      var cityCircle = new google.maps.Circle({
        strokeColor: '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#FF0000',
        fillOpacity: 0.35,
        map: map,
        center: searchCoord,
        radius: searchRadius //radius is in meters
      });
      destination.lat = searchCoord.lat;
      destination.lng = searchCoord.lng;
      markersList.push(marker);
      //Adds circle into markerList so that it gets cleared at the same time
      markersList.push(cityCircle);
    }
  };

});

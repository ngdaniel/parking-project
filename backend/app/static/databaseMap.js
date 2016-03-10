// String format to work somewhat like pythons print formatter
String.prototype.format = function() {
  var i = 0,
    args = arguments;
  return this.replace(/{}/g, function() {
    return typeof args[i] != 'undefined' ? args[i++] : '';
  });
};

//On document creation adds click event handler to forms
$(function() {
  $('#getGpsLocation').bind('click', function() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(data) {
        $('input[name="latitudeOrigin"]').val(data.coords.latitude);
        $('input[name="longitudeOrigin"]').val(data.coords.longitude);
      });
    } else {
      alert("Geolocation is not supported by this browser.");
    }
    return false;
  });

  ///////////////////////////////////////////////////////////////////////////////
	// Button logic event handlers
	document.getElementById("showLines").onclick = function() {
		drawPaystations();
	};
	var timestamp;
	document.getElementById("searchTime").onclick = function() {
		var timestamp = $('input[id="timestamp"]').val();
		thisDate = $('input[id="date"]').val();
		thisTime = $('input[id="time"]').val();
		dateParts = thisDate.split('-');
		timeParts = thisTime.split(':');
		date = new Date(dateParts[0], parseInt(dateParts[1], 10) - 1, dateParts[2], timeParts[0], timeParts[1]);
		timestamp = date.getTime() / 1000; // unix time from date /time entry

		if (!timestamp) {
			timestamp = 1455290482; //Date.now() / 1000 | 0; // current unix time
		} // showDensities(1451649600); 1455290482
		console.log(timestamp);
		document.getElementById("timestamp").value = timestamp;
		console.log('Selected : ' + thisTime + ' ' + thisDate + ' or ' + timestamp);


		showDensities(timestamp);
	};
	document.getElementById("refresh").onclick = function() {
		clearMap();
	};

	// Paystation Lines

	// TODO auto fit lines to roads
	// TODO info text on line hover
	// TODO speedup density draw

	var lineList = [];
	var infoLineList = [];
	var value;
	// Places line (with color and thinckness weighted)
	function drawLine(coords, color, size) {
		// console.log('drawing...weight = ' + size + ' : color = ' + color);
		var mapLine = new google.maps.Polygon({
			clickable: true,
			geodesic: true,
			fillColor: color,
			fillOpacity: 0.100000,
			paths: coords,
			strokeColor: color,
			strokeOpacity: 0.800000,
			strokeWeight: size
		});
		// var infowindow = null
		// // doesnt wooooooooooooooooooooooork value doesnt update on click
		// google.maps.event.addListener(mapLine, 'click', function(event) {
		// var infowindow = new google.maps.InfoWindow({content: value});
		// 	console.log(value);
		// 	infowindow.position = event.latLng;
		//   infowindow.open(map);
		// });
		mapLine.setMap(map);
		lineList.push(mapLine);
		// infoLineList.push(infowindow)

	}

	// Parse paystation endpoint
	function drawPaystations() {
		// Loop through paystations and draw each block with dynamic color
		$.getJSON($SCRIPT_ROOT + "/paystations", function(result) {
			$.each(result, function(i, data) {
				coords = [
					new google.maps.LatLng(data[1], data[0]),
					new google.maps.LatLng(data[3], data[2])
				];
				value = data[6] + ' spots';
				if (data[6] > 0) {
					// Calculate size and color of line
					var size = data[6] / 2;
					var hue = 2 * (50 - data[6]); // big = red small = light_green
					var color = 'hsl(' + hue + ', 100%, 75%)';
					drawLine(coords, color, size); // Set color based off capacity
				}
			});
		});
	}

	// Parse Occupancy
	var densities = new Map();

	function showDensities(time) {
		var total = 0;
		var n = 0;
		// Loop through occupancy at given time
		$.getJSON($SCRIPT_ROOT + '/densities?time=' + time, function(density_json) {
			$.each(density_json, function(id, data) {
				var density = parseFloat(JSON.stringify(eval(data)));
				value = JSON.stringify(data) + ' capacity';
				densities.set(id, density);
				total += density;
				n += 1;
			});
			var elm_ids = Array.from(densities.keys());

			// draw line colored based off density
			if (elm_ids.length > 0) {
				url = $SCRIPT_ROOT + "/paystations?element_keys=" + elm_ids.join('%20');
				// console.log(url);
				// console.log(densities);
				console.log('Parking Load : ' + total / n); // averagge
				$(".content .value").html('Parking Load :  <b>' + parseInt(100 * total / n) + '%<b>');

				$.getJSON(url, function(paystation_json) {
					$.each(paystation_json, function(id, data) {
						coords = [
							new google.maps.LatLng(data[1], data[0]),
							new google.maps.LatLng(data[3], data[2])
						];
						// scale so red is full, green empty
						var hue = parseInt(130 * (1 - densities.get(id)));
						hue = Math.max(0, hue); //TODO wtf, some densities are > 1 thus hue < 0
						var color = 'hsl(' + hue + ', 100%, 50%)';
						var size = data[6] / 1.8;
						// console.log(densities.get(id) + ' : ' + coords);
						// console.log(densities.get(id) + '-->' + color);
						drawLine(coords, color, 3);
					});
				});
			} else {
				alert("No info found at that time");
			}
		});
	}
	////////////////////////////////////////////////////////////////////////////////

  //!!@!@!?@!?@?!@?!?///
  var map;
  var directionsService;
  var directionsServiceBus;
  var directionsDisplay;
  var directionsDisplayBus;
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
  var autoDstLocation;
  var autoSrcLocation;
  var polylineList = [];
  var detailsPanel = $("#directions_panel");
  var summaryPanel = $("#summary_panel");


  //Creates map over seattle and adds click dlistener
  window.initMap = function() {
    directionsService = new google.maps.DirectionsService();
    directionsDisplay = new google.maps.DirectionsRenderer();

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



    directionsService  = new google.maps.DirectionsService;
    directionsDisplay = new google.maps.DirectionsRenderer;
    directionsDisplay.setMap(map);
    directionsDisplay.setPanel(document.getElementById('drivingDirections'));

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
            autoSrcLocation = place['formatted_address'];
        }
    });
    
    $("#searchRadius").change( function(){
        searchRadius = parseInt($(this).val()); 
        $("#curRadius").html(searchRadius);
        console.log("search radius =" + searchRadius);
    });

    //Grab location from Destination Auto Search when changed
    autoDst.addListener('place_changed', function() {
            var place = autoDst.getPlace();
            if (!place.geometry) {
              window.alert("Autocomplete's returned place contains no geometry");
              return;
            }else{
                console.log(place);
                autoDstLocation = place['formatted_address'];
            }
        });

     //Checks which boxes are checked and takes the destination and source
    //If they are filled out , then directions will be drawn
    $('#routeToLocation').bind('click', function() {
            //Set desintationSpot Value
            var destinationSpot;
             if($('input[name=dst]:checked').val()=='marker'){
                destinationLat= nearestPayStation[1];
                destinationLon= nearestPayStation[0];
                destinationSpot = new google.maps.LatLng(destinationLat,destinationLon);
            }else if ($('input[name=dst]:checked').val()=='searchDst'){
                destinationSpot = autoDstLocation;
            }
            //Set SourceSpot Value
           var originSpot;
           if($('input[name=src]:checked').val()=='gps'){
               if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(function(data) {
                            originlat = data.coords.latitude;
                            originlng = data.coords.longitude;
                            originSpot = new google.maps.LatLng(originlat,originlng);
                     //     directions(directionsService,directionsDisplay,originSpot,destinationSpot,google.maps.TravelMode.DRIVING);
 
                          directionsExp(directionsService,directionsDisplay,originSpot,destinationSpot,google.maps.TravelMode.DRIVING);
                    })
                    } else {
                        alert("Geolocation is not supported by this browser.");
                    }
           }else if($('input[name=src]:checked').val()=='searchSrc'){
                 originSpot = autoSrcLocation;  
                  directionsExp(directionsService,directionsDisplay,originSpot,destinationSpot,google.maps.TravelMode.DRIVING);
             
            //  directions(directionsService,directionsDisplay,originSpot,destinationSpot,google.maps.TravelMode.DRIVING); 
        }
        });

      var polyline = new google.maps.Polyline({
         path: [],
         geodesic: true,
         strokeColor: '#FF0000',
         strokeOpacity: 1.0,
         strokeWeight: 2
       });      
          function directionsExp(directionsService,directionsDisplayer,originSpot,destSpot,mode){
          directionsService.route({
                origin: originSpot,
                destination: destSpot,
                travelMode: mode,
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
                            $div.append( "<b>Route Segment: " + (index + 1) +" :  "+ route.summary +"</b><br />");
                            $div.append( routeSegment.start_address + " to ");
                            $div.append( routeSegment.end_address + "<br />");
                            $div.append(  routeSegment.distance.text + "<br /><br />");
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
                        //polyline.setMap(map);
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

   function directions(directionsService,directionsDisplayer,originSpot,destSpot,mode){
      directionsService.route({
            origin: originSpot,
            destination: destSpot,
            travelMode: mode,
            provideRouteAlternatives:true
        }, function (response,status){
            if(status == google.maps.DirectionsStatus.OK){
                console.log(response);
                $.each(response.routes, function(index,route ){
                console.log(route);
                });
                directionsDisplayer.setDirections(response);
            }
            else{
                window.alert('Directions request faield due to ' + status);
            }
        });
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
        //console.log(nearestPayStation[4]);
      });
      return false;
    }
	// Clears the map of markers
	function clearMap() {
        clearLines();	
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

    function clearLines(){
        for (var j = 0; j < lineList.length; j++) {
            lineList[j].setMap(null);
        }
		lineList = [];
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

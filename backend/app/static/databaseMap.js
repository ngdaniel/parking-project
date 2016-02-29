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

	// Paystation Lines

	// Checkbox logic
	document.getElementById("showLines").onclick = function() {
		if (this.checked) {
			getPaystations();
		} else {
			console.log('Refreshing...');
			location.reload(); // TODO clear lines instead
		}
	};

	// Places line (with color and thinckness weighted)
	function drawLine(coords, weight) {
		var size = weight / 1.5
		var hue = 2 * (55 - weight) // big = red small = light_green
		var scaledColor = 'hsl(' + hue + ', 100%, 50%)';
		// scaledColor = 'hsla(160, 100%, 90%, 0.68)';
		var polygon = new google.maps.Polygon({
			clickable: false,
			geodesic: true,
			fillColor: scaledColor,
			fillOpacity: 0.100000,
			paths: coords,
			strokeColor: scaledColor,
			strokeOpacity: 0.800000,
			strokeWeight: size
		});
		polygon.setMap(map);
	}

	// Parse paystation endpoint
	function getPaystations() {
		// Loop through paystations and draw each block with dynamic color
		$.getJSON(  $SCRIPT_ROOT+ "/paystations", function(result) {
			$.each(result, function(i, data) {
				// data [0:3] start and end coords, [4:5] center coord [6] capacity
				var coords = new Array(); //TODO is this line needed

				var coords = [
					new google.maps.LatLng(data[1], data[0]),
					new google.maps.LatLng(data[3], data[2])
				];

				// Set color based off capacity
				if (data[6] > 0) {
					drawLine(coords, data[6]);
				}
				// console.log(JSON.stringify(data))	// DEBUG
			});
		});
	}

	////////////////////////////////////////////////////////////////

	var map;
    var directionsService;
    var directionsServiceBus;
    var directionsDisplay ;
    var directionsDisplayBus;
    var markersList = [];
	var infoWindowList = [];
	var destination = {
		lat: 47.60801,
		lng: -122.335167
	};
    //destination
	var nearestPayStation;
    var nearestPayStationID;
    
    var gpsLat;
    var gpsLng;

	var	searchRadius = .25;
    var autoSrc;
    var autoDst;
    
    var autoDstLocation;
    var autoSrcLocation;
	
    //Creates map over seattle and adds click dlistener
	window.initMap = function() {
	   map = new google.maps.Map(document.getElementById('map'), {
			center: {
				lat: 47.60801,
				lng: -122.335167
			},
			//zoom: 12,//see entire city
            zoom:15, //see middle of downtown
			disableDefaultUI: true,
			zoomControl: true,
			zoomControlOptions: {
				position: google.maps.ControlPosition.TOP_RIGHT
			},
		});
       map.addListener('click', function(e) {
            clearMap();
			placeMarkerAndFindPayStations(e.latLng, map);
		});

       
       directionsService  = new google.maps.DirectionsService; 
       directionsServiceBus = new google.maps.DirectionsService;
       directionsDisplay = new google.maps.DirectionsRenderer;
       directionsDisplayBus = new google.maps.DirectionsRenderer;
       directionsDisplay.setMap(map);
       directionsDisplay.setPanel(document.getElementById('drivingDirections'));
       directionsDisplayBus.setMap(map);
       directionsDisplayBus.setPanel(document.getElementById('busDirections'));

     var srcInput = /** @type {!HTMLInputElement} */ (document.getElementById("dirSrc"));
     var dstInput = /** @type {!HTMLInputElement} */  (document.getElementById("dirDst"));
       autoSrc  = new google.maps.places.Autocomplete(srcInput);
       autoDst = new google.maps.places.Autocomplete(dstInput);
    
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
                          directions(directionsServiceBus,directionsDisplayBus,originSpot,destinationSpot,google.maps.TravelMode.TRANSIT);
                          directions(directionsService,directionsDisplay,originSpot,destinationSpot,google.maps.TravelMode.DRIVING);
 
                    })
                    } else {
                        alert("Geolocation is not supported by this browser.");
                    }
           }else if($('input[name=src]:checked').val()=='searchSrc'){
                  originSpot = autoSrcLocation;  
                   directions(directionsServiceBus,directionsDisplayBus,originSpot,destinationSpot,google.maps.TravelMode.TRANSIT);
                  directions(directionsService,directionsDisplay,originSpot,destinationSpot,google.maps.TravelMode.DRIVING); 
        }
        });

   function directions(directionsService,directionsDisplayer,originSpot,destSpot,mode){
      directionsService.route({
            origin: originSpot,
            destination: destSpot,
            travelMode: mode,
            provideRouteAlternatives:true
        }, function (response,status){
            if(status == google.maps.DirectionsStatus.OK){
                console.log(response)
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
			//Queries python API for datapoints
			$.getJSON($SCRIPT_ROOT + '/paystations_in_radius', {
				latitude: latLng.lat,
				longitude: latLng.lng,
				radius: searchRadius
			}, function(data) {
				console.log(data)
				markAndCircle(latLng, searchRadius, map);
				//Loop over each datapoint(payStation)
				nearestPayStation = null;
                $.each(data, function(index) {
					payStationItem = data[index];
					console.log(payStationItem);
					idNumber = index;
                    meterLat = payStationItem[5];
                    meterLong = payStationItem[4];
                    meterMaxOcc = payStationItem[6];
                    distance = payStationItem[7];
                    if(nearestPayStation == null){
                        nearestPayStation = payStationItem;
                        nearestPayStationID = idNumber; 
                    }
                    else if(nearestPayStation[7] > distance){
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

		//Clerars the map of markers
		function clearMap() {
			for (var i = 0; i < markersList.length; i++) {
				markersList[i].setMap(null);
			}
			infoWindowList = [];
			markersList = [];
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
				radius: searchRadius * 1000 //radius is in meters
			});
			destination.lat = searchCoord.lat;
			destination.lng = searchCoord.lng;
			markersList.push(marker);
			//Adds circle into markerList so that it gets cleared at the same time
			markersList.push(cityCircle);
		}
	}
});

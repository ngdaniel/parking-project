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
	$('a#calculate').bind('click', function() {
		$.getJSON($SCRIPT_ROOT + '/paystations_in_radius', {
			latitude: $('input[name="latitude"]').val(),
			longitude: $('input[name="longitude"]').val(),
			radius: $('input[name="radius"]').val()
		}, function(data) {
			$.each(data.result, function(index) {
				payStationItem = data.result[index]
				console.log(index);
				idNumber = payStationItem[0];
				meterLat = payStationItem[1];
				meterLong = payStationItem[2];
				meterMaxOcc = payStationItem[3];
				distance = payStationItem[4];
				text = '<li> PayStation {} is located at ({} , {}), maximum occupancy is {} cars and is {} km away'.format(idNumber, meterLong, meterLat, meterMaxOcc, distance);
				$("#resultList").after(text);

			});
		});
		return false;
	});

	var map;
	var markersList = [];
	var infoWindowList = [];
	//Creates map over seattle and adds click listener
	window.initMap = function() {
		map = new google.maps.Map(document.getElementById('map'), {
			center: {
				lat: 47.60801,
				lng: -122.335167
			},
			zoom: 15,
			disableDefaultUI: true,
			scrollwheel: false
		});
		map.addListener('click', function(e) {
			placeMarkerAndFindPayStations(e.latLng, map);
		});

		//Gets data points from library and plots the markers
		//radius is gotten from textBox, default is 250m
		function placeMarkerAndFindPayStations(latLng, map) {
			clearMap();
			searchRadius = $('input[name="radius"]').val();
			if (searchRadius == 0) {
				searchRadius = .25
			}
			//Queries python API for datapoints
			$.getJSON($SCRIPT_ROOT + '/paystations_in_radius', {
				latitude: latLng.lat,
				longitude: latLng.lng,
				radius: searchRadius
			}, function(data) {
				markAndCircle(latLng, searchRadius, map);
				//Loop over each datapoint(payStation)
				$.each(data.result, function(index) {
					payStationItem = data.result[index]
					idNumber = payStationItem[0];
					meterLat = payStationItem[1];
					meterLong = payStationItem[2];
					meterMaxOcc = payStationItem[3];
					distance = payStationItem[4];
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
			markersList.push(marker);
			//Adds circle into markerList so that it gets cleared at the same time
			markersList.push(cityCircle);
		}
	}

});

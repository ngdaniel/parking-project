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
	var directionsService;
	var chart;
	var markersList = [];
	var markersHash = [];
	var infoWindowList = [];
	var polylineList = [];
	var payStationList = [];
	var destination = {
		lat: 47.60801,
		lng: -122.335167
	};

	var nearestPayStation, nearestPayStationID;
	var gpsLat, gpsLng;
	var autoSrc, autoDst;
	var originSpot, destinationSpot;

	var searchRadius = parseInt($("#searchRadius").val());
	var detailsPanel = $("#directions_panel");
	var summaryPanel = $("#summary_panel");
	var payStationPanel = $("#payStationSelection");
	var payStationOptionsPanel = $("#payStationArea");
	$("#curRadius").html(searchRadius);

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
			placeMarkerAndFindPayStations(e.latLng, map, true);
		});


		makeChart();
		$("#buttonChart").bind('click', function() {
			console.log("chart");
			changeChartData();
		});
		$("#lowerChart").bind('click', function() {
			console.log("Lowerchart");
			lowerChart(this);
		});



		autoSrc = new google.maps.places.Autocomplete( /** @type {!HTMLInputElement} */ (document.getElementById("dirSrc")));
		autoDst = new google.maps.places.Autocomplete( /** @type {!HTMLInputElement} */ (document.getElementById("dirDst")));

		//Grab location from Source Auto Search when changed
		autoSrc.addListener('place_changed', function() {
			var place = autoSrc.getPlace();
			if (!place.geometry) {
				window.alert("Autocomplete's returned place contains no geometry");
				return;
			} else {
				console.log(place);
				originSpot = place.formatted_address;
				searchedSpot = new google.maps.LatLng(place.geometry.location.lat(), place.geometry.location.lng());
				createMarker(searchedSpot, 'start', originSpot.address, 'green');
			}
		});


		//Grab location from Destination Auto Search when changed
		autoDst.addListener('place_changed', function() {
			var place = autoDst.getPlace();
			if (!place.geometry) {
				window.alert("Autocomplete's returned place contains no geometry");
				return;
			} else {
				console.log(place);
				searchedSpot = new google.maps.LatLng(place.geometry.location.lat(), place.geometry.location.lng());
				placeMarkerAndFindPayStations(searchedSpot, map, true);
				// destinationSpot = place.formatted_address;
			}
		});
		$('#gps').bind('click', function() {
			if (navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(function(data) {
					originlat = data.coords.latitude;
					originlng = data.coords.longitude;
					originSpot = new google.maps.LatLng(originlat, originlng);
					$("#dirSrc").val(data.coords.latitude + ',' + data.coords.longitude);
					createMarker(originSpot, 'start', 'gps', 'green');
				});
			} else {
				alert("Geolocation is not supported by this browser.");
			}
			return false;
		});

		$("#searchRadius").change(function() {
			searchRadius = parseInt($(this).val());
			$("#curRadius").html(searchRadius);
			console.log("search radius =" + searchRadius);
		});

		//Checks which boxes are checked and takes the destination and source
		//If they are filled out , then directions will be drawn
		$('#routeToLocation').bind('click', function() {
			clearMap();
			clearDirectionsPanel();
			directionsExp(directionsService, originSpot, destinationSpot);
		});

		var polyline = new google.maps.Polyline({
			path: [],
			geodesic: true,
			strokeColor: '#FF0000',
			strokeOpacity: 1.0,
			strokeWeight: 2
		});
		$('input[type=button]').click(function() {
			$('input[type=button]').removeClass('active');
			$(this).addClass('active');
		});
		//present the closest paystation to lcation, give cost and average drive time
		//locations of cheaper ones- show walking distance and time
		//location of ones that will have less people in it
		function showPayStationOptions() {
			console.log("showPayStationOptions");
			//cloest
			var optionsAmount = 3;
			var close = $("#closestPayStation");
			var cheap = $("#cheapestPayStation");
			var empty = $("#emptiestPayStation");
			payStationOptionsPanel.html("");
			if (close.hasClass("active")) {
				for (i = 0;
					(i < optionsAmount) && (i < payStationList.length); i++) {
					generatePayStationOption(payStationList[i], payStationOptionsPanel);
				}
			} else if (cheap.hasClass("active")) {
				console.log("show cheapest");
			} else if (empty.hasClass("active")) {
				console.log("show emptiest");
			}
		}

		function generatePayStationOption(payStationItem, target) {
			var options = $("<div>", {
				class: "optionsBox"
			});
			options.hover(
				function() {

					$(this).addClass('selectHover');
					markersHash[payStationItem[8]].setIcon($SCRIPT_ROOT + "static/parkingGood.png");
					//TODO:CHANGE BARCHART DATA
					timeForcast(getTimestamp(),payStationItem[8],changeChartData,false);
                    //changeChartData(payStationItem[8], false);
				},
				function() {
					$(this).removeClass('selectHover');
					markersHash[payStationItem[8]].setIcon($SCRIPT_ROOT + "static/parkingBlue.png");
				}
			);
			//TODO:replace class with something more attractive
			options.click(function() {

                timeForcast(getTimestamp(),payStationItem[8],changeChartData,true);
			//	changeChartData(payStationItem[8], false);
				$('div.optionsBox').removeClass('active');
				$(this).addClass('active');
				destinationSpot = new google.maps.LatLng(payStationItem[5], payStationItem[4]);
			});
            getDensity(getTimestamp(),payStationItem[8],function(data){
                options.append("<img src =" + $SCRIPT_ROOT + " '/static/parkingBlue.png'class='transportIcon'>");
                
                var optionsText = $("<div>",{
                    class:"optionsTextContainer"
                }); 
                optionsText.append("<p> Distance: " + (payStationItem[7]*1000).toFixed(1)  + " m" + "</p>");
                //optionsText.append("<br>");
                optionsText.append("<p> Density: " + parseFloat(JSON.stringify(data)) + "</p>");
                options.append(optionsText); 
                target.append(options);
            })
			//options.append("<p> Density: " + blockDensity + "</p>");
		}

		//find paystation that costs the least
		//find paystation that is emptiest
		function directionsExp(directionsService, originSpot, destSpot) {
			if (originSpot === null && destSpot === null) {
				alert("missing Starting Location and pay Station destination");
			} else if (originSpot === null) {
				alert("missing Starting Location");
			} else if (destSpot === null) {
				alert("Missing payStation destination");
			} else {
				directionsService.route({
						origin: originSpot,
						destination: destSpot,
						travelMode: google.maps.TravelMode.DRIVING,
						drivingOptions: {
							trafficModel: google.maps.TrafficModel.BEST_GUESS,
							departureTime: new Date(Date.now()),
						},
						provideRouteAlternatives: true
					},
					function(response, status) {
						if (status == google.maps.DirectionsStatus.OK) {

							console.log(response);
							var bounds = new google.maps.LatLngBounds();
							var summaryList = [];
							var detailsList = [];
							var startLocation = {};
							var endLocation = {};
							var routeList = [];

							/////////////////do route logic here and loop over the route array
							$.each(response.routes, function(index, routeOption) {
								routeList.push(routeOption);
							});
							console.log(routeList);

							$.each(routeList, function(index, route) {
								console.log(route);
								//Route Summary at the top of the page
								var $div = $("<div>", {
									id: "foo",
									class: "directionsBox"
								});
								$div.data("directions", index);

								//show route information associated when div clicked on
								$div.click(function() {
									clearPolyLines();
									directionsNumber = jQuery(this).data('directions');
									detailsPanel.html(detailsList[directionsNumber].html());
									polylineList[directionsNumber].setMap(map);
								});

								$.each(route.legs, function(routeNumber, routeSegment) {
									if (index === 0) {
										var $fromAndTo = $("<div>");
										//TODO: Get the names of address and replace them here
										$fromAndTo.append("<span> From: " + routeSegment.start_address + "</span>");
										$fromAndTo.append("<br>");
										$fromAndTo.append("<span> To: " + routeSegment.end_address + "</span>");
										$fromAndTo.append("<br>");
										summaryPanel.append($fromAndTo);
									}

									////////////////Each Route  Box ///////////////////////////////


									$div.append("<img src =" + $SCRIPT_ROOT + '/static/parkingBlue.png' + " class='transportIcon'>");
									$div.append("<b>Route: " + (index + 1) + " -  Via:" + route.summary + "</b>");
									$div.append("<span>" + routeSegment.distance.text + "</span>");
									$div.append("<span>" + routeSegment.duration.text + "</span>");
									$div.append("<br />");

								});

								//storing the divs inside an array to mess with later
								summaryList[index] = $div;
								summaryPanel.append($div);
								summaryPanel.append("<hr>");

								////////////////////Stitching pollyLine route together////////////////////
								var path = route.overview_path;
								var legs = route.legs;
								var $directions = $("<div>", {
									id: "foo",
									class: "fee"
								});
								$div.click(function() {
									//hide the other content
									//s
								});
								for (i = 0; i < legs.length; i++) {
									if (i === 0) {
										startLocation.latlng = legs[i].start_location;
										startLocation.address = legs[i].start_address;
										startLocation.marker = createMarker(legs[i].start_location, "start", legs[i].start_address, "green");
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


									for (j = 0; j < steps.length; j++) {
										var nextSegment = steps[j].path;

										////////////////Each Driving Step of the Route////////////////////
										var $drivingStep = $("<div>", {
											class: "drivingStep"
										});
										var $icon = $("<div>", {
											class: "transportIconHolder"
										});
										$icon.append("<img src =" + $SCRIPT_ROOT + '/static/dot.png' + " class='drivingSymbol'>");
										$drivingStep.append($icon);
										$drivingStep.append("<div class='drivingInstructions'>" + steps[j].instructions + "</div>");
										if (steps[j].distance && steps[j].distance.text) {

											var $drivingStepStats = $("<div>", {
												class: "drivingStepStats"
											});
											$drivingStepStats.append("<div class='divide'></div>");
											$drivingStepStats.append("<div class ='stepStats'>" + steps[j].duration.text + " (" + steps[j].distance.text + ") " + "</div>");
											$drivingStep.append($drivingStepStats);
										}
										$directions.append($drivingStep);

										for (k = 0; k < nextSegment.length; k++) {
											polyline.getPath().push(nextSegment[k]);
											bounds.extend(nextSegment[k]);
										}
									}
								}
								///////////////////////////////////////////////////
								detailsList[index] = $directions;
								polylineList[index] = polyline;
								map.fitBounds(bounds);
								endLocation.marker = createMarker(endLocation.latlng, "end", endLocation.address, "red");

							});
						} else alert(status);
					});
			}
		}

		function createMarker(placement, title, adress, color) {
			var marker = new google.maps.Marker({
				position: placement,
				draggable: false,
				map: map,
				icon: 'http://maps.google.com/mapfiles/ms/icons/' + color + '-dot.png',
				title: title
			});
			markersList.push(marker);
		}

		//Gets data points from library and plots the markers
		//radius is gotten from textBox, default is 250m
		function placeMarkerAndFindPayStations(latLng, map, draw) {
			clearMap();
			payStationList = [];
			//Queries python API for datapoints
			$.getJSON($SCRIPT_ROOT + '/paystations_in_radius', {
				latitude: latLng.lat,
				longitude: latLng.lng,
				radius: searchRadius / 1000
			}, function(data) {
				// console.log(data);
				//Loop over each datapoint(payStation)
				nearestPayStation = null;
				var nFound = 0;
				$.each(data, function(index) {

					nFound++;
					payStationItem = data[index];
					payStationItem[8] = index;
					payStationList.push(payStationItem);
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
						// console.log(distance);
						nearestPayStation = payStationItem;
						nearestPayStationID = idNumber;
					}

					if (draw) {
						//Adds marker and infowindow  + click listners for each payStation
						var marker = new google.maps.Marker({
							position: new google.maps.LatLng(meterLat, meterLong),
							map: map,
							icon: $SCRIPT_ROOT + '/static/parkingBlue.png'
								//have different colored parking .png files for busy/notbusy/somewhat busy
						});

						//TODO: Make a better looking Info window
						infoWindowContent = '<p>Blockface {} has a max capacity {} and is {} m away from destination </p>'.format(idNumber, meterMaxOcc, distance.toFixed(2) * 1000);
						var infoWindow = new google.maps.InfoWindow({
							content: infoWindowContent
						});
						marker.addListener('mouseover', function() {
							infoWindow.open(map, marker);
							//changeChartData(payStationItem[8], false);

                            timeForcast(getTimestamp(),payStationItem[8],changeChartData,false);
						});
						marker.addListener('mouseout', function() {
							for (var i = 0; i < infoWindowList.length; i++) {
								infoWindowList[i].close();
							}
						});
						markersHash[payStationItem[8]] = marker;
						markersList.push(marker);
						infoWindowList.push(infoWindow);
					}
				});
				//sort List for distance
				payStationList.sort(function(a, b) {
					return a[7] - b[7];
				});
				console.log(payStationList);
				markAndCircle(latLng, searchRadius, map);
				if (nFound !== 0 && draw) {
					console.log("Found " + nFound + " paystations within range");
					//destinationSpot = new google.maps.LatLng(nearestPayStation[5],nearestPayStation[4]);
					showPayStationOptions();
				} else {
					//alert('No paystations within radius of desired location');
					payStationOptionsPanel.html("No Paystations within radius of desired Locaiton");
				}
				//console.log(nearestPayStation[4]);
			});
			return false;
		}
		// Clears the map of markers
		function clearMap() {
			//clearLines();
			clearMarkers();
			clearPolyLines();
			polylineList = [];
			infoWindowList = [];
		}

		// Make directions empty again
		function clearDirectionsPanel() {
			summaryPanel.html('');
			detailsPanel.html('');
		}

		function clearMarkers() {
			for (var i = 0; i < markersList.length; i++) {
				markersList[i].setMap(null);
			}
			markersList = [];
		}

		function clearPolyLines() {
			for (var j = 0; j < polylineList.length; j++) {
				polylineList[j].setMap(null);
			}
		}

		//takes a latLong object , radius , and map
		//draws a maker and circle around point
		function markAndCircle(searchCoord, searchRadius, map) {
			var marker = new google.maps.Marker({
				draggable: true,
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
			var bounds = cityCircle.getBounds();
			map.fitBounds(bounds);

			marker.addListener('dragend', function(event) {
				destination.lat = event.latLng.lat();
				destination.lng = event.latLng.lng();
				placeMarkerAndFindPayStations(destination, map, true);
			});
			destination.lat = searchCoord.lat;
			destination.lng = searchCoord.lng;
			markersList.push(marker);
			//Adds circle into markerList so that it gets cleared at the same time
			markersList.push(cityCircle);
		}
	};

	function makeChart() {
		chart = c3.generate({
			bindto: '#chart',
			data: {
				columns: [
					['PayStation XX', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
				],
				transition: {
					duration: 100,
				},
				types: {
					data1: 'bar' // ADD
				}
			},
			axis: {
				y: {
					label: {
						text: 'Cars',
						position: 'outer-middle'
					}
				},
				x: {
					label: {
						text: 'Hours',
						position: 'outer-middle'
					}
				},
			}
		});
	}


	function changeChartData(plotData,payStationId, hover) {
        if (hover) {
			title = 'Pay Station' + payStationId;
		} else {
			title = 'Pay Station Hover';
		}
        var dataArray=[];
        dataArray[0]=title;
        //dataArray.concat(plotData);
        dataArray.push.apply(dataArray, plotData);
        console.log(dataArray);
		chart.load({
			columns: [
				dataArray
			],
			type: 'bar'
		});
	}


	function lowerChart() {
		$("#chartContainer").animate({
			height: '0%'
		}, {
			duration: 400,
			queue: false
		});
		$("#map").animate({
			height: '100%'
		}, {
			duration: 400,
			queue: false
		});
		$("#lowerChart").unbind();
		$("#lowerChart").bind("click", function() {
			raiseChart();
		});
	}

	function raiseChart() {
		$("#chartContainer").animate({
			height: '25%'
		}, {
			duration: 400,
			queue: false
		});
		$("#map").animate({
			height: '75%'
		}, {
			duration: 400,
			queue: false
		});

		$("#lowerChart").unbind();
		$("#lowerChart").bind("click", function() {
			lowerChart();
		});
	}
});

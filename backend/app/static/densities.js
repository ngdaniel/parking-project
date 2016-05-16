$(function() {
	$(".load .value").html('<font size="2">Choose date and time</font>');
	document.getElementById("showLots").onclick = function() {
		drawPaystations();
	};
	document.getElementById("searchTime").onclick = function() {
		$(".load .value").html('<font size="2">Can take up to a minute...</font>');
		clearLines();
		showDensities(getTimestamp());
	};

	document.getElementById("searchKeyTime").onclick = function() {
		elm_id = document.getElementById("elm_id").value;
		timeForcast(getTimestamp(), elm_id);
	};

	document.getElementById("clear").onclick = function() {
		clearLines();
	};

	// Gets time from input fields and returns unix timestamp
	function getTimestamp() {
		var timestamp = $('input[id="timestamp"]').val();
		thisDate = $('input[id="date"]').val();
		thisTime = $('input[id="time"]').val();
		console.log(thisTime);

		// fill empty time and date
		if (thisDate === '') {
			thisDate = (new Date()).toISOString().slice(0, 10); // just take current timestamp if no date given
		}
		if (thisTime === '') {
			thisTime = "12:00"; // Default time
		}


		// Hack to fake future data
		dateParts = thisDate.split('-');
		if (dateParts[0] >= 2016) {
			dateParts[0] = 2015;
		}
		timeParts = thisTime.split(':');
		date = new Date(dateParts[0], parseInt(dateParts[1], 10) - 1, dateParts[2], timeParts[0], timeParts[1]);
		timestamp = date.getTime() / 1000; // unix time from date /time entry
		console.log('Selected : ' + timestamp + ' : ' + thisTime + ' ' + thisDate);
		return timestamp;
	}


	////////////////////////// Paystation Lines
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
			clickable: false,
			geodesic: true,
			fillColor: color,
			fillOpacity: 0.100000,
			paths: coords,
			strokeColor: color,
			strokeOpacity: 0.800000,
			strokeWeight: size
		});

		mapLine.setMap(map);
		lineList.push(mapLine);

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
					var color = 'hsl(' + hue + ', 100%, 50%)';
					drawLine(coords, color, size); // Set color based off capacity
				}
			});
		});
	}

	// Gets density for given hour
	function getHour(time, elm_id, callback) {
		query = '/densities?time=' + time + '&element_keys=' + elm_id;
		$.getJSON($SCRIPT_ROOT + query, function(block_json) {
			if (Object.keys(block_json).length === 0 && block_json.constructor === Object) {
				callback(0);
			}
			$.each(block_json, function(id, data) {
					callback(parseFloat(JSON.stringify(data)));
			});
		});
	}

	// Tmp final callback
	function final() { console.log('Done', results); }

	// Returns list of hourly timestamps for the given day
	function hoursInDate(time) {
		var hours = [];
		var d = new Date(time*1000);  // set timestamp (ms) to start of the day
		d.setMinutes(0);
		for (var i = 0; i < 24; i++) {
			d.setHours(i);  // incriment an hour
			time = d.getTime() / 1000;
			hours.push(time);
		}
		return hours;
	}

	// Returns list of densities for a given day and element id
	var results = []
	function timeForcast(time, elm_id) {
		elm_id = 123942;
		var hours = hoursInDate(time);
		hours.forEach(function(time) {
			getHour(time, elm_id, function(result){
		    results.push(result);
		    if(results.length == hours.length) {
		      final();
		    }
		  })
		});
	}

	// var hourly_dens = new Array(24).fill(0);
	// function timeForcast(time, elm_id) {
	// 	elm_id = 123942;
	// 	var d = new Date(time*1000);  // set timestamp (ms) to start of the day
	// 	d.setMinutes(0);
	// 	for (i = 0; i < 24; i++) {
	// 		(function(i) {
	// 			d.setHours(i);  // incriment an hour
	// 			time = d.getTime() / 1000;
	// 			query = '/densities?time=' + time + '&element_keys=' + elm_id;
	// 			// console.log(i,query);
	// 			getHour(query, i);
	//
	// 		})(i);
	// 	}
	// }
	//
	// // Returns density for single hour of elm id
	// function getHour(query, i) {
	// 	$.getJSON($SCRIPT_ROOT + query, function(block_json) {
	// 		if (Object.keys(block_json).length === 0 && block_json.constructor === Object) {
	// 			console.log('no data');
	// 			hourly_dens[i] = 0;
	// 		}
	// 		$.each(block_json, function(id, data) {
	// 				var density = parseFloat(JSON.stringify(data));
	// 				hourly_dens[i] = density;
	// 				console.log(i,density,hourly_dens);
	// 		});
	// 	});
	// }

	// Parse Occupancy
	var densities = new Map();

	function showDensities(time) {
		var total = 0;
		var n = 0;
		// Loop through occupancy at given time
		$.getJSON($SCRIPT_ROOT + '/densities?time=' + time, function(density_json) {
			$.each(density_json, function(id, data) {
				var density = parseFloat(JSON.stringify(data));
				// console.log(density);
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
				$(".load .value").html('Parking Load :  <b>' + parseInt(100 * total / n) + '%<b>');

				$.getJSON(url, function(paystation_json) {
					$.each(paystation_json, function(id, data) {
						coords = [
							new google.maps.LatLng(data[1], data[0]),
							new google.maps.LatLng(data[3], data[2])
						];
						// scale so red is full, green empty
						var hue = parseInt(130 * (1 - densities.get(id)));
						hue = Math.max(0, hue);
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

	function clearLines() {
		for (var j = 0; j < lineList.length; j++) {
			lineList[j].setMap(null);
		}
		lineList = [];
	}
});

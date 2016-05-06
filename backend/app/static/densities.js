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
			thisDate = (new Date()).toISOString().slice(0,10);  // just take current timestamp if no date given
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
		console.log('Selected : ' + timestamp + ' : '+ thisTime + ' ' + thisDate);
		return timestamp;
	}

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
		// // doesnt work value doesnt update on click
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
					var color = 'hsl(' + hue + ', 100%, 50%)';
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
				$(".load .value").html('Parking Load :  <b>' + parseInt(100 * total / n) + '%<b>');

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

    function clearLines(){
        for (var j = 0; j < lineList.length; j++) {
            lineList[j].setMap(null);
        }
		lineList = [];
    }


});

// var map;
function initMap() {
	// Create Map
	var map = new google.maps.Map(document.getElementById('map'), {
		center: {
			lat: 47.60801,
			lng: -122.335167
		},
		zoom: 15,
		disableDefaultUI: true,
		scrollwheel: true
	});


	function drawLine(coords, weight) {
		var size = weight/1.5
		var hue =  2*(55 - weight) // big = red small = light_green
		var scaledColor = 'hsl(' + hue + ', 100%, 50%)';
		// scaledColor = 'hsla(160, 100%, 90%, 0.68)';
		var polygon = new google.maps.Polygon({
			clickable: true,
			geodesic: true,
			fillColor: scaledColor ,
			fillOpacity: 0.100000,
			paths: coords,
			strokeColor: scaledColor ,
			strokeOpacity: 0.800000,
			strokeWeight: size
		});
		polygon.setMap(map);
	}

	// Loop through paystations and draw each block with dynamic color
	$.getJSON("http://127.0.0.1:5000/paystations", function(result) {
		$.each(result, function(i, data) {
			// data [0:3] start and end coords, [4:5] center coord [6] capacity
			var coords = new Array();		//TODO is this line needed

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


















// // draw single line
// var data =   [-122.331, 47.6018, -122.331, 47.602, -122.331, 47.6019, 4]
//
// var coords = [
// 	new google.maps.LatLng(data[1], data[0]),
// 	new google.maps.LatLng(data[3], data[2])
// ];
//
// drawLine(coords, "#cb4b4b");
//
// // draw single line
// var data = [-122.33054937746653, 47.601822730001246, -122.3308297335514, 47.602016542002914]
//
// var coords = [
// 	new google.maps.LatLng(data[1], data[0]),
// 	new google.maps.LatLng(data[3], data[2])
// ];
//
// drawLine(coords, "#1ced1f");


// // draw single line
// var data =   [-122.331, 47.6018, -122.331, 47.602, -122.331, 47.6019, 4]
//
// var coords = [
// 	new google.maps.LatLng(data[1], data[0]),
// 	new google.maps.LatLng(data[3], data[2])
// ];
//
// drawLine(coords, "#cb4b4b");
//
// 	var polygon = new google.maps.Polygon({
// 		clickable: false,
// 		geodesic: true,
// 		fillColor: "#FF0000",
// 		fillOpacity: 0.300000,
// 		paths: coords,
// 		strokeColor: "#FF0000",
// 		strokeOpacity: 1.000000,
// 		strokeWeight: 3
// 	});
// 	polygon.setMap(map);
// }


// 		var mypath = new Array();
// 		line = JSON.parse(field.Linestring);
// 		//Parse the array of LatLngs into Gmap points
// 		for (var i = 0; i < line.length; i++) {
// 			//Tokenise the coordinates
// 			var coords = (new String(line[i])).split(",");
// 			console.log(coords);

		// }
	// var data = [-122.33054937746653, 47.601822730001246, -122.3308297335514, 47.602016542002914]
	// // var mypath = new Array();
	// console.log(data);
	// // mypath.push(new google.maps.LatLng(data.slice(0,2), data.slice(2,4)));
	// var mypath = [
  //   {lat: data[0], lng: data[1]},
  //   {lat: data[2], lng: data[3]},
  // ];
	// console.log(mypath);
	// var polyline = new google.maps.Polyline({
	// 	path: mypath,
	// 	strokeColor: '#ff0000',
	// 	strokeOpacity: 1.0,
	// 	strokeWeight: 3
	// });
	// polyline.setMap(map);

	// Add lines
	// var url = "http://127.0.0.1:5000/paystations"
	// $.getJSON(url, function(data) {
		//  Parse the Linestring field into an array of LatLngs
		// $.each(data, function(index, line) {
			// var mypath = new Array();
			// line = JSON.parse(record);
			// console.log(record);
			// console.log(line);
			// new google.maps.LatLng(line[0], line[1]));
			//Tokanise coordinates
			// for var i = 0; i < line.length; i++) {
			// 	var coords = (new String(line[i])).split(",");
			// 	mypath.push(new google.maps.LatLng(coords[1], coords[0]));
			// }
			// Parse the array of LatLngs into Gmap points
			// for (var i = 0; i < line.length; i++) {
			// 	//Tokenise the coordinates
			// 	var coords = (new String(line[i])).split(",");
			// 	mypath.push(new google.maps.LatLng(coords[1], coords[0]));
			// }
			// var polyline = new google.maps.Polyline({
			// 	path: mypath,
			// 	strokeColor: '#ff0000',
			// 	strokeOpacity: 1.0,
			// 	strokeWeight: 3
			// });
			// polyline.setMap(map);
	// 	});
	// });

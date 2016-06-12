//This file contains functions to manipulate the c3 chartt



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

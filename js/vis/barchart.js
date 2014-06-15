// Constructor
function Barchart(containerId, variable){
	this.type = 'Barchart';
	this._containerId = containerId;
	this._variable = variable;
	this._filteredData = undefined;
	this._displayData = this.createDataset(myApp._data[this._variable], true);
	this.create();
	// Append filter if there is any
	if (myApp._masterFilter._filter != undefined)
		this.appendFilter(myApp._masterFilter._filter);
}

// Resize: https://groups.google.com/forum/#!topic/d3-js/mTBxTLi0q1o
Barchart.prototype.createDataset = function(variable, removeErroreVariables){
	var data;
	if (variable.description.dataType == 'metric')
		data = variable.binnedData.data; // Use binned data for data!
	else
		data = variable.data;
	var displayData = [];
	//displayData.names = [];
	//displayData.frequency = [];
	var datamap = [];

	for (var i = 0; i < data.length; i++) {
		var currentElement = data[i];
		var index = datamap.indexOf(currentElement);
		if (index != -1) // increase counter
			displayData[index].frequency = displayData[index].frequency + 1;
		else {// add element
			newElement = {};
			newElement.name = currentElement;
			newElement.frequency = 1;
			displayData.push(newElement)
			datamap.push(currentElement);
		}
	}

	if (removeErroreVariables)
	errorVariables = [];
	for (var i = 0; i < displayData.length; i++)
		if (parseInt(displayData[i].name) > 500 || displayData[i].name == undefined){
			displayData.splice(i, 1);
			i = i - 1;
		}
	
	var result = displayData.sort(function(a, b) {return d3.ascending(parseInt(a.name), parseInt(b.name));});
	return result;
}

Barchart.prototype.removeFilter = function() { 
	this._filteredData = undefined;
	$(this._containerId + ' .bar-filter').remove();
}

Barchart.prototype.appendFilter = function(filter) {
	// Remove old filters if there are any
	this.removeFilter();

	var height = this._helperHeight;
	var width = this._helperwidth;

	var x = d3.scale.ordinal()
			.rangeRoundBands([0, width], .1);

	var y = d3.scale.linear()
			.range([height, 0]);
	x.domain(this._displayData.map(function(d) { return d.name; }));
	y.domain([0, d3.max(this._displayData, function(d) { return d.frequency; })]);

	var filteredData = this.createDataset(filter._data[this._variable], true);
	var enter = this._svg.selectAll(".bar-filter").data(filteredData).enter();
	enter.append("rect")
			.attr("class", "bar-filter")
			.attr("x", function(d) { return x(d.name); })
			.attr("width", x.rangeBand())
			.attr("y", function(d) { return y(d.frequency); })
			.attr("height", function(d) {return height - y(d.frequency); });
}

Barchart.prototype.create = function(){

	var margin = {top: 20, right: 20, bottom: 30, left: 60},
			width = $(this._containerId).width() - margin.left - margin.right,
			height = $(this._containerId).height() - margin.top - margin.bottom;

	this._helperHeight = height;
	this._helperwidth = width;

	var x = d3.scale.ordinal()
			.rangeRoundBands([0, width], .1);

	var y = d3.scale.linear()
			.range([height, 0]);

	var xAxis = d3.svg.axis()
			.scale(x)
			.orient("bottom")
			// .ticks(2, "%")
			// .tickFormat(function(d) { console.log(myApp._data[this._variable]); }.bind(this));
			.tickFormat(function(d, i) {
				if(myApp._data[this._variable].description.dataType == 'metric')
					return myApp._data[this._variable].binnedData.dictionary[d];
				else
					return myApp._data[this._variable].description.dictionary[d]; 
			}.bind(this));
	var yAxis = d3.svg.axis()
			.scale(y)
			.orient("left");

	var actualWidth = width + margin.left + margin.right;
	var actualHeight = height + margin.top + margin.bottom;
	var svg = d3.select(this._containerId).append("svg")
			.attr("xmlns", "http://www.w3.org/2000/svg")
			.attr("viewBox", "0 0 " + actualWidth + " " + actualHeight)
			.attr("width", actualWidth)
			.attr("height", actualHeight)
		.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	// Label X
	// svg.append("text") // text label for the x axis
	// 	.attr("x", width / 2 )
	// 	.attr("y",	height + margin.bottom)
	// 	.style("text-anchor", "middle")
	// 	.text(this._variable);

	// Label Y

	// svg.append("text")
	// 	.attr("transform", "rotate(-90)")
	// 	.attr("y", 0 - margin.left)
	// 	.attr("x", 0 - (height / 2))
	// 	.attr("dy", "1em")
	// 	.style("text-anchor", "middle")
	// 	.text("Number of Subjects");
	// x.domain(data.map(function(d) { return d.letter; }));
	// y.domain([0, d3.max(data, function(d) { return d.frequency; })]);
	x.domain(this._displayData.map(function(d) { return d.name; }));
	y.domain([0, d3.max(this._displayData, function(d) { return d.frequency; })]);

	svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + height + ")")
			.call(xAxis)
		.append("text")
			.attr("x", width / 2 )
			.attr("y", 20)
			//.attr("y",	height + margin.bottom)
			.attr("dy", ".71em")
			.style("text-anchor", "end")
			.text(this._variable);

	svg.append("g")
			.attr("class", "y axis")
			.call(yAxis)
		.append("text")
			.attr("transform", "rotate(-90)")
			.attr("y", 6)
			.attr("dy", ".71em")
			.style("text-anchor", "end")
			.text("Number of Subjects");

	this._svg = svg;

	var enter = svg.selectAll(".bar").data(this._displayData).enter();
	enter.append("rect")
			.attr("class", "bar")
			.attr("x", function(d) { return x(d.name); })
			.attr("width", x.rangeBand())
			.attr("y", function(d) { return y(d.frequency); })
			.attr("height", function(d) { return height - y(d.frequency); });

	// FIX: Not correctly rescaled: https://bugs.webkit.org/show_bug.cgi?id=71819
	var foreignObject = enter.append("foreignObject")
		.attr("x", function(d) { return x(d.name) + 60; })
		.attr("id", function(d, i) { return 'renderWindow_' + d.name; })
		.attr("vis-type", 'Barchart')
		.attr("var", this._variable)
		.attr("id", function(d, i) { return d.name;})
		.attr("width", x.rangeBand())
		// .attr("y", function(d) { return y(d.frequency); })
		.attr("y", 0 )
		.attr("height", function(d) { return height - y(d.frequency); });

	// Request Render Window
	var elementList = {};

	var variable = myApp._data[this._variable];
	var data;
	var dictionary;
	if (variable.description.dataType == 'metric') {
		data = variable.binnedData; // Use binned data for data!
		dictionary = variable.binnedData.dictionary;
	}
	else {
		data = variable;
		dictionary = variable.description.dictionary;
	}

	for (var i in data.data) {
		var currentElement = data.data[i];
		if (!elementList.hasOwnProperty(currentElement))
			elementList[currentElement] = [];
		 //if (myApp._data.SEX_SHIP2.data[i] == 2) TODO VIS Filter Gender
		elementList[currentElement].push(myApp._data['zz_nr'].data[i]);
	}
	// console.log(foreignObject);
	// console.log("foreignObject[0].length" + foreignObject[0].length);
	//console.log(elementList);
	// if (foreignObject[0].length != 2)
		for (var i = 0; i < foreignObject[0].length; i++) {
			// console.log(data.dictionary[elementList[foreignObject[0][i].__data__.name]]);
			myDebug = {"name": variable.name + ": " + dictionary[foreignObject[0][i].__data__.name]};
			myApp._masterRenderer.calculateMean(elementList[foreignObject[0][i].__data__.name], this._containerId + " #" + foreignObject[0][i].id, {"name": variable.name + ": " + dictionary[foreignObject[0][i].__data__.name], "vis": "barchart"});

		}
	// else { // Calculate Mean Shapes
	// 	myApp._masterRenderer.calculateMean(elementList[foreignObject[0][0].__data__.name], this._containerId + " #" + foreignObject[0][0].id, {"name": variable.name + ": " + dictionary[foreignObject[0][0].__data__.name]});
	// 	myApp._masterRenderer.calculateMean(elementList[foreignObject[0][1].__data__.name], this._containerId + " #" + foreignObject[0][1].id, { "calculateMean":	this._containerId + " #" + foreignObject[0][0].id, "name": variable.name + ": " + dictionary[foreignObject[0][1].__data__.name]});
	// }
	
}
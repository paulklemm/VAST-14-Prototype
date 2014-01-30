// Constructor
function Barchart(containerId, variable){
  this._containerId = containerId;
  this._variable = variable;
  this._displayData = this.createDataset();
  this.create();
}

// Resize: https://groups.google.com/forum/#!topic/d3-js/mTBxTLi0q1o

Barchart.prototype.createDataset = function(){
	var data = myApp._data[this._variable];
	var displayData = [];
	//displayData.names = [];
	//displayData.frequency = [];
	var datamap = [];

	for (var i = 0; i < data.data.length; i++) {
		var currentElement = data.data[i];
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

	return displayData;
}

Barchart.prototype.create = function(){

  var margin = {top: 20, right: 20, bottom: 30, left: 60},
      width = $(this._containerId).width() - margin.left - margin.right,
      height = $(this._containerId).height() - margin.top - margin.bottom;

  var x = d3.scale.ordinal()
      .rangeRoundBands([0, width], .1);

  var y = d3.scale.linear()
      .range([height, 0]);

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left");
      // .ticks(10, "%");
      //.ticks(10);

  var actualWidth = width + margin.left + margin.right;
  var actualHeight = height + margin.top + margin.bottom;
  var svg = d3.select(this._containerId).append("svg")
      .attr("viewBox", "0 0 " + actualWidth + " " + actualHeight)
    	.attr("width", actualWidth)
    	.attr("height", actualHeight)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  
    // x.domain(data.map(function(d) { return d.letter; }));
    // y.domain([0, d3.max(data, function(d) { return d.frequency; })]);
    x.domain(this._displayData.map(function(d) { return d.name; }));
    y.domain([0, d3.max(this._displayData, function(d) { return d.frequency; })]);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
      .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end");
        // .text("Frequency");

    svg.selectAll(".bar")
        .data(this._displayData)
      .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return x(d.name); })
        .attr("width", x.rangeBand())
        .attr("y", function(d) { return y(d.frequency); })
        .attr("height", function(d) { return height - y(d.frequency); });
}
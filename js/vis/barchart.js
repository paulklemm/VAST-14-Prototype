// Constructor
function Barchart(containerId, variable){
  this._containerId = containerId;
  this._variable = variable;
  this._displayData = this.createDataset(true);
  this.create();
}

// Resize: https://groups.google.com/forum/#!topic/d3-js/mTBxTLi0q1o
Barchart.prototype.createDataset = function(removeErroreVariables){

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

  if (removeErroreVariables)
  errorVariables = [];
  for (var i = 0; i < displayData.length; i++)
    if (parseInt(displayData[i].name) > 500){
      displayData.splice(i, 1);
      i = i - 1;
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
      .orient("bottom")
      // .tickFormat(function(d) { console.log(myApp._data[this._variable]); }.bind(this));
      .tickFormat(function(d) { return myApp._data[this._variable].description.dictionary[d] }.bind(this));
      //data.description.dictionary[currentElement]
// myApp._data[this._variable]
// data.description.dictionary[currentElement]
  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left");
      // .ticks(10, "%");
      //.ticks(10);

  var actualWidth = width + margin.left + margin.right;
  var actualHeight = height + margin.top + margin.bottom;
  var svg = d3.select(this._containerId).append("svg")
      .attr("xmlns", "http://www.w3.org/2000/svg")
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
    .attr("width", x.rangeBand())
    // .attr("y", function(d) { return y(d.frequency); })
    .attr("y", 0 )
    .attr("height", function(d) { return height - y(d.frequency); });


  // var foreignObjectMain = enter.append("foreignObject")

  //   .attr("x", function(d) { return x(d.name) + 60; })
  //   .attr("width", x.rangeBand())
  //   .attr("y", function(d) { return y(d.frequency); })
  //   .attr("height", function(d) { return height - y(d.frequency); });

  // var foreignObject = foreignObjectMain.append("xhtml:div")
  //   .attr('xmlns', "http://www.w3.org/1999/xhtml")
  //   .attr('class', 'renderDiv')
  //   .attr("id", function(d, i) { return 'renderWindow_' + d.name; });


  // Request Render Window
  var elementList = {};
  var data = myApp._data[this._variable];
  for (var i in data.data) {
    var currentElement = data.data[i];
    if (!elementList.hasOwnProperty(currentElement))
      elementList[currentElement] = [];
    elementList[currentElement].push(myApp._data['zz_nr'].data[i]);
  }
  // console.log(foreignObject);
  // console.log("foreignObject[0].length" + foreignObject[0].length);
  for (var i = 0; i < foreignObject[0].length; i++) {
    myApp.calculateMean(elementList[foreignObject[0][i].__data__.name], this._containerId + " #" + foreignObject[0][i].id);
    
  }
}
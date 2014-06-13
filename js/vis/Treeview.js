// Constructor
// function Treeview(containerId, variables){
function Treeview(containerId, variableX, variableY){
	this._containerId = containerId;
	this._variableX = variableX;
	this._variableY = variableY;
	this._displayData = this.createDataset(true, false);
	this.create(this._displayData);
}

Treeview.prototype.createDataset = function(removeErroreVariables, nameAsLabels){
	if (nameAsLabels == undefined)
		nameAsLabels = false;

  var variableX = myApp._data[this._variableX];
  var variableY = myApp._data[this._variableY];

  var dataX;
  var dataY;
  if (variableX.description.dataType == 'metric')
    dataX = variableX.binnedData.data; // Use binned data for data!
  else
    dataX = variableX.data;
  if (variableY.description.dataType == 'metric')
    dataY = variableY.binnedData.data; // Use binned data for data!
  else
    dataY = variableY.data;


  displayData = {name:"root", value: dataX.length, children: []};
  var _helper = {};

	for (var i = 0; i < dataX.length; i++) {
		if (parseInt(dataX[i]) < 500 || !removeErroreVariables) {
			if (_helper[dataX[i]] == undefined) {
				_helper[dataX[i]] = {};
				_helper[dataX[i]].value = 0;
				// Variable X Children
				if (variableX.description.dataType == 'metric')
					_helper[dataX[i]].label = variableX.binnedData.dictionary[dataX[i]];
				else
					_helper[dataX[i]].label = variableX.description.dictionary[dataX[i]];
				_helper[dataX[i]].name = dataX[i];

				_helper[dataX[i]].children = {};
			}

			// Variable Y Children
			if (parseInt(dataY[i]) < 500 || !removeErroreVariables) {
				if (_helper[dataX[i]].children[dataY[i]] == undefined) {
					_helper[dataX[i]].children[dataY[i]] = {};
					if (variableY.description.dataType == 'metric')
							_helper[dataX[i]].children[dataY[i]].label = variableY.binnedData.dictionary[dataY[i]];
						else
							_helper[dataX[i]].children[dataY[i]].label = variableY.description.dictionary[dataY[i]];
					
					_helper[dataX[i]].children[dataY[i]].name = dataY[i];
					_helper[dataX[i]].children[dataY[i]].value = 0;
				}
				_helper[dataX[i]].children[dataY[i]].value = _helper[dataX[i]].children[dataY[i]].value + 1;
				_helper[dataX[i]].value = _helper[dataX[i]].value + 1;
			}
		}
	}


  // Create Data set as required from helper data set
  xkeys = Object.keys(_helper);
  for (var i = 0; i < xkeys.length; i++) {
  	var newElement = {};
		newElement.name = _helper[xkeys[i]].name;
		newElement.value = _helper[xkeys[i]].value;
		ykeys = Object.keys(_helper[xkeys[i]].children)
		for (j = 0; j < ykeys.length; j++) {
			if (newElement.children == undefined)
				newElement.children = [];
			newChildren = {};
			newChildren.name = _helper[xkeys[i]].children[ykeys[j]].name;
			newChildren.value = _helper[xkeys[i]].children[ykeys[j]].value;
			newElement.children.push(newChildren);
		}
  	displayData.children.push(newElement);
  }
  return(displayData);
}

Treeview.prototype.create = function (data) {
	var variableX = myApp._data[this._variableX];
  var variableY = myApp._data[this._variableY];
  
  var dictionaryX;
  var dictionaryY;
  if (variableX.description.dataType == 'metric')
  	dictionaryX = variableX.binnedData.dictionary;
  else
  	dictionaryX = variableX.description.dictionary;
  
  if (variableY.description.dataType == 'metric')
  	dictionaryY = variableY.binnedData.dictionary;
  else
  	dictionaryY = variableY.description.dictionary;

  // var color = d3.scale.category10();
  var color = d3.scale.category20();

  var margin = {top: 0, right: 10, bottom: 10, left: 10},
		width = $(this._containerId).width() - margin.left - margin.right,
		height = $(this._containerId).height() - margin.top - margin.bottom;

  // var canvas = d3.select("#canvas").append("svg")
  var canvas = d3.select(this._containerId).append("svg")
    .attr("width", width)
    .attr("height", height);

  var treemap = d3.layout.treemap()
    .size([width, height])
    .nodes(data)

  var cells = canvas.selectAll(".cell")
    .data(treemap)
    .enter()
    .append("g")
      .attr("class", "cell")

  cells.append("rect")
    .attr("x", function(d) { return d.x; })
    .attr("y", function(d) { return d.y; })
    .attr("width", function(d) { return d.dx; })
    .attr("height", function(d) { return d.dy; })
    .attr("fill", function(d) {return d.children ? null : color(d.parent.name);})
    .attr("stroke", '#fff')
  cells.append("text")
    .attr("x", function(d) { return d.x + d.dx / 2})
    .attr("y", function(d) { return d.y + 20})
    .style('font-size', '9px')
    .attr("text-anchor", "middle")
    .text(function(d) {return d.children ? null : dictionaryX[d.parent.name] + '>' + dictionaryY[d.name];})

   var foreignObject = cells.append("foreignObject")
		.attr("x", function(d) { return d.x; })
    .attr("y", function(d) { return d.y; })
    .attr("id", function(d, i) { return 'renderWindow_' + d.name + '_' + i;  })
    .attr("id_x", function(d, i) { return d.children ? null : d.parent.name; } )
    .attr("id_y", function(d, i) { return d.children ? null : d.name; } )
    .attr("width", function(d) { return d.dx; })
    // .on('mouseover', function(e) { console.log("Mouse Over"); console.log(e); })
    .attr("height", function(d) { return d.dy; })

    // Request Render window
		for (var i = 0; i < foreignObject[0].length; i++) {
			// console.log(data.dictionary[elementList[foreignObject[0][i].__data__.name]]);
			var currentForeignObject = foreignObject[0][i];
			var id_x = currentForeignObject.getAttribute('id_x');
			var id_y = currentForeignObject.getAttribute('id_y');
			if (id_x != null && id_y != null) {
				var elementList = this.getElementList(parseInt(id_x), parseInt(id_y));
				// myApp._masterRenderer.calculateMean(elementList, this._containerId + " #" + foreignObject[0][i].id, {"name": variable.name + ": " + dictionary[foreignObject[0][i].__data__.name]});
				// Note: Name is needed for Clustering results, put the proper Names here
				// var settings = {"name": this._variableX + "" + id_x + ">" +  id_y};
				var settings = {"name": this._variableX + "-" + dictionaryX[id_x] + ">" + this._variableY + "-" + dictionaryY[id_y]};
				myApp._masterRenderer.calculateMean(elementList, "#canvas #" + foreignObject[0][i].id, settings);
			}
		}
}

Treeview.prototype.getElementList = function(x, y) {
	var variableX = myApp._data[this._variableX];
  var variableY = myApp._data[this._variableY];
  if (variableX.description.dataType == 'metric')
    dataX = variableX.binnedData.data; // Use binned data for data!
  else
    dataX = variableX.data;
  if (variableY.description.dataType == 'metric')
    dataY = variableY.binnedData.data; // Use binned data for data!
  else
    dataY = variableY.data;
	
	var elementList = [];
	for (var i = 0; i < dataX.length; i++) {
		if ((dataX[i] == x) && (dataY[i] == y)) {
			elementList.push(myApp._data.zz_nr.data[i]);
		}
	}
	return elementList;
}
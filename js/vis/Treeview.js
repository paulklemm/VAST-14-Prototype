// Constructor
// function Treeview(containerId, variables){
function Treeview(containerId, variableX, variableY){
	this.type = 'Treeview';
	this._containerId = containerId;
	this._variableX = variableX;
	this._variableY = variableY;
	this._filteredData = undefined;
	this._displayData = this.createDataset(true, false, myApp._data[this._variableX], myApp._data[this._variableY]);
	this._treemap = undefined;
	this.create(this._displayData);
	// Append filter if there is any
	if (myApp._masterFilter._filter != undefined)
		this.appendFilter(myApp._masterFilter._filter);
}

// Recursive function which attaches a hashmap for each
// Children node of the treemap object for parsing pleasure
Treeview.prototype.recurse_createNodeObject = function(node) {
	if (node.children != undefined) {
		node.childrenHash = {};
		for (var i = 0; i < node.children.length; i++) {
			node.childrenHash[node.children[i].name] = node.children[i];
			// Recursive Call on children function
			this.recurse_createNodeObject(node.children[i]);
		}
	}
}

Treeview.prototype.removeFilter = function() {
	this._filteredData = undefined;
	$(this._containerId + ' .treeview-filter').remove();
}

Treeview.prototype.appendFilter = function(filter) {
	// Remove old filters if there are any
	this.removeFilter();
	this._filteredData = this.createDataset(true, false, filter._data[this._variableX], filter._data[this._variableY]);

	var treemap = d3.layout.treemap()
		.size([this._helperwidth, this._helperheight])
		.nodes(this._filteredData)

	// Iterate over all existing rectangles
	var rectangles = $(this._containerId + " .treeview-rect");
	// Create Hash-access for arrays
	this.recurse_createNodeObject(this._filteredData);
	this.recurse_createNodeObject(rectangles[0].__data__);
	for (var i = 0; i < rectangles.length; i++) {
		var data = rectangles[i].__data__;
		var structure = rectangles[i].getAttribute('structure').split(',');
		// If we are at a leaf object and the filtered data set contains this value
		if (structure.length == 3 && 
				this._filteredData.childrenHash[structure[1]] != undefined &&
				this._filteredData.childrenHash[structure[1]].childrenHash[structure[2]] != undefined) {
			var dataFilter = this._filteredData.childrenHash[structure[1]].childrenHash[structure[2]];
			// Get proper height
			var filterHeight = ( parseInt(dataFilter.value) * parseInt(rectangles[i].getAttribute('height'))) / parseInt(data.value);
			// Append new Rectangle!
			d3.select(rectangles[i].parentElement).append('rect')
				.attr('class', 'treeview-rect treeview-filter')
				.attr('structure', structure)
				.attr('x', rectangles[i].getAttribute('x'))
				.attr('y', parseInt(rectangles[i].getAttribute('height')) - filterHeight + parseInt(rectangles[i].getAttribute('y')))
				.attr('width', rectangles[i].getAttribute('width'))
				.attr('height', filterHeight);
		}
	}
}

Treeview.prototype.createDataset = function(removeErroreVariables, nameAsLabels, variableX, variableY){
	if (nameAsLabels == undefined)
		nameAsLabels = false;

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

	this._helperwidth = width;
	this._helperheight = height;

	// var canvas = d3.select("#canvas").append("svg")
	var canvas = d3.select(this._containerId).append("svg")
		.attr("width", width)
		.attr("height", height);

	var treemap = d3.layout.treemap()
		.size([width, height])
		.nodes(data)

	this._treemap = treemap;
	this._canvas = canvas;

	var cells = canvas.selectAll(".cell")
		.data(treemap)
		.enter()
		.append("g")
			.attr("class", "cell")

	cells.append("rect")
		.attr('class', 'treeview-rect')
		.attr("structure", function(d) {
			var structure = [d.name];
			var currentNode = d;
			while(currentNode.parent != undefined) {
				currentNode = currentNode.parent;
				structure.unshift(currentNode.name);
			}
			return structure;
		})
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

	this._cells = cells;

	var foreignObject = cells.append("foreignObject")
		.attr("x", function(d) { return d.x; })
		.attr("y", function(d) { return d.y; })
		.attr("id", function(d, i) { return 'renderWindow_' + d.name + '_' + i;	})
		.attr("vis-type", 'Treeview')
		.attr("id_x", function(d, i) { return d.children ? null : d.parent.name; } )
		.attr("id_y", function(d, i) { return d.children ? null : d.name; } )
		.attr("var_x", this._variableX)
		.attr("var_y", this._variableY)
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
			// var settings = {"name": this._variableX + "" + id_x + ">" +	id_y};
			var settings = {"name": this._variableX + "-" + dictionaryX[id_x] + ">" + this._variableY + "-" + dictionaryY[id_y]};
			myApp._masterRenderer.calculateMean(elementList, this._containerId + " #" + foreignObject[0][i].id, settings);
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
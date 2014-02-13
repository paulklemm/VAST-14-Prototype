// Constructor
function App(){
	this._data = undefined;
	this._crossfilter = undefined;
	this._groups = undefined;
	this._visualizations = [];
	this._serverCommunication = new ServerCommunication('http://localhost:8081');
	this._masterRenderer = new MasterRenderer();
	this._pivotTable = undefined;

	debugMeshList = [];
	debugScene = undefined;
	debugGeomtryList = [];
	// Note: Bind Method binds this element to the method call, so 'this'
	// will refer to the object, not the window element
	// See https://stackoverflow.com/questions/13996794/javascript-prototype-this-issue
	//this.loadDataAsync(this.constructCrossfilterDataset.bind(this));
	this.loadDataAsync(this.dataLoaded.bind(this));
};
// myApp.compareGeometries(debugGeomtryList[0], debugGeomtryList[1])
App.prototype.compareGeometries = function(geometry1, geometry2) {
	meanDifference = 0;
	meanDifferenceX = 0;
	meanDifferenceY = 0;
	meanDifferenceZ = 0;
	for (var i = 0; i < geometry1.vertices.length; i++) { // Parse all Vertices
		meanDifference = meanDifference + Math.abs(geometry1.vertices[i].x - geometry2.vertices[i].x);
		meanDifference = meanDifference + Math.abs(geometry1.vertices[i].y - geometry2.vertices[i].y);
		meanDifference = meanDifference + Math.abs(geometry1.vertices[i].z - geometry2.vertices[i].z);
		
		meanDifferenceX = meanDifferenceX + Math.abs(geometry1.vertices[i].x - geometry2.vertices[i].x);
		meanDifferenceY = meanDifferenceY + Math.abs(geometry1.vertices[i].y - geometry2.vertices[i].y);
		meanDifferenceZ = meanDifferenceZ + Math.abs(geometry1.vertices[i].z - geometry2.vertices[i].z);
	}

	meanDifference = meanDifference / (geometry1.vertices.length * 3);
	meanDifferenceX = meanDifferenceX / (geometry1.vertices.length);
	meanDifferenceY = meanDifferenceY / (geometry1.vertices.length);
	meanDifferenceZ = meanDifferenceZ / (geometry1.vertices.length);

	console.log("MeanDifference: " + meanDifference);
	console.log("MeanDifferenceX: " + meanDifferenceX);
	console.log("MeanDifferenceY: " + meanDifferenceY);
	console.log("MeanDifferenceZ: " + meanDifferenceZ);
}

App.prototype.dataLoaded = function(){
	this.constructCrossfilterDataset();
	this.loadGroupDataAsync(ui.createSidebar);
	this._pivotTable = new PivotTable('#pivotTable', this._data);
}

App.prototype.loadGroupDataAsync = function(callback) {
	var filePath = "data/ship-data/data/shipdata/groups-S2.json";
	var app = this;

	d3.json(filePath, function(groups){
		groupArray = [];
		for (var key in groups){
			var dataElement = {};
			dataElement.name = key;
			dataElement.links = groups[key];
			groupArray.push(dataElement);
		}
		app._groups = groupArray; // set group data

		// Execute Callback if defined
		if (callback != undefined)
			callback(groupArray);
	});
}

App.prototype.loadDataAsync = function(callback) {
	var filePath = 'data/ship-data/data/shipdata/SHIP_2012_D_S2_20121129/SHIP_2012_D_S2_20121129.json';
	var app = this; // Reference this objects, since it wont be available in the callback
	d3.json(filePath, function(data){
		app._data = data; // set data
		// Execute Callback if defined
		if (callback != undefined)
			callback(data);
	});
}

App.prototype.createMatchingVisualization = function(detail) {
	var type = this._data[detail.id].description.dataType;
	if (type == 'dichotomous' || type == 'ordinal')
		vis = new Barchart(detail.containerId, detail.id);
	detail.visualization = vis;
	myApp._visualizations.push(detail);
}

App.prototype.removeRegisteredVisualization = function(containerId) {
		for (var i = 0; i < this._visualizations.length; i++)
			if (containerId == this._visualizations[i]['containerId'])
				this._visualizations.splice(i, 1);
}

App.prototype.calculateMean = function(elements, domId, settings) {
	// console.log("Calculating Mean for domId " + domId);
	this._serverCommunication.getMeanShapeAsync(elements, domId, settings, function(result) {
		// console.log("Got result for DOM ID " + result.domId);
		// Create Renderer
		debugGeomtryList.push(result.mean);
		// myApp._masterRenderer.setDifferenceVertexColors(debugGeomtryList[0], debugGeomtryList[1]);
		var myRenderer = new Renderer(result.domId, result.mean); 
	});
}

// Crossfilter Library needs it's data in a specific format
// See [Reference](https://github.com/square/crossfilter/wiki/API-Reference) for details
App.prototype.constructCrossfilterDataset = function(){
	if (this._data == undefined) {
		console.error("Could not create Crossfilter dataset, there is no data set loaded.");
		console.error(this);
		return;
	}
	// Construct array which crossfilter accepts. It will look like this:
	// [
	// 	{date: "2011-11-14T16:17:54Z", quantity: 2, total: 190, tip: 100, type: "tab"},
	// 	{date: "2011-11-14T16:20:19Z", quantity: 2, total: 190, tip: 100, type: "tab"},
	// 	{date: "2011-11-14T16:28:54Z", quantity: 1, total: 300, tip: 200, type: "visa"},
	// ]
	var dataAsArray = d3.values(this._data); // Data Object as Array - makes it easier to traverse it
	var numberOfSubjects = dataAsArray[0].data.length;
	var result = new Array(numberOfSubjects); // Create empty Array with right number of entries
	for (i = 0; i < numberOfSubjects; i++){
		result[i] = {};
		for (j = 0; j < dataAsArray.length; j++) {
			result[i][dataAsArray[j].name] = dataAsArray[j].data[i];
		}
	}
	this._crossfilter = crossfilter(result);
}
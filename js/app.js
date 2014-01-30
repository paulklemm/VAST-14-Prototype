// Constructor
function App(){
	this._data = undefined;
	this._crossfilter = undefined;
	this._groups = undefined;
	this._visualizations = [];
	// Note: Bind Method binds this element to the method call, so 'this'
	// will refer to the object, not the window element
	// See https://stackoverflow.com/questions/13996794/javascript-prototype-this-issue
	//this.loadDataAsync(this.constructCrossfilterDataset.bind(this));
	this.loadDataAsync(this.dataLoaded.bind(this));
};

App.prototype.dataLoaded = function(){
	this.constructCrossfilterDataset();
	this.loadGroupDataAsync(ui.createSidebar);
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
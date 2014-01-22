// Constructor
function App(){
	this._data = undefined;
	this._crossfilter = undefined;
	this.loadDataAsync();
	//this.constructCrossfilterDataset();
};

App.prototype.loadDataAsync = function(callback) {
	filePath = 'data/ship-data/data/shipdata/SHIP_2012_D_S2_20121129/SHIP_2012_D_S2_20121129.json';
	var app = this; // Reference this objects, since it wont be available in the callback
	d3.json(filePath, function(data){
		app._data = data; // set data
		// Execute Callback if defined
		if (callback != undefined)
			callback(data);
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
// Constructor
function App(){
	this._data = undefined;
	this._crossfilter = undefined;
	this._groups = undefined;
	this._visualizations = [];
	this._serverCommunication = new ServerCommunication('http://localhost:8081');
	// this._serverCommunication = new ServerCommunication('isggate.cs.uni-magdeburg.de:8081');
	this._masterRenderer = new MasterRenderer();
	this._pivotTable = undefined;
	this._statistics = new Statistics();
	this._calculateOddsRatios = false;
	this._oddsRatioTableMatrix = undefined;
	this._zz_nrHash = undefined
	this._cramersVMatrix = undefined;
	this._saveTimeOnStartup = true; // this reads cramersV from disk

	debugMeshList = [];
	debugScene = undefined;
	// Note: Bind Method binds this element to the method call, so 'this'
	// will refer to the object, not the window element
	// See https://stackoverflow.com/questions/13996794/javascript-prototype-this-issue
	//this.loadDataAsync(this.constructCrossfilterDataset.bind(this));
	this.loadDataAsync(this.dataLoaded.bind(this));

	// TODO VIS Hack This should go into the ui.js
	$('#opener').on('click', function() {		
		var panel = $('#slide-panel');
		if (panel.hasClass("visible")) {
			panel.removeClass('visible').animate({'margin-right':'-600px'});
		} else {
			panel.addClass('visible').animate({'margin-right':'0px'});
		}	
		return false;	
	});
	$('#collapse-navbar').on('click', function() {		
		var panel = $('.navbar');
		if (panel.hasClass("visible")) {
			panel.removeClass('visible').animate({'height':'1%'});
		} else {
			panel.addClass('visible').animate({'height':'75%'});
		}	
		return false;	
	});
	// Click handler
    jQuery('.animated-wrapper').on('click', function () {
      
        // State checker
        if( jQuery(this).attr('data-state') === 'neutral' ) {
            jQuery(this).attr('data-state', 'slide-right')
        } else {
            jQuery(this).attr('data-state', 'neutral')
        }
    });
};

App.prototype.createVariableForAllSubjects = function() {
	var length = this._data.zz_nr.data.length;
	var newVar = {};
	var data = [];
	for (var i = 0; i < length; i++)
		data.push(0);
	newVar.data = data;
	newVar.invalidIndices = [];
	var dictionary = {'0': 'all'}
	newVar.description = {"dataType": 'ordinal', "detail": "All Variables", "name": "all", "dictionary": dictionary};
	this._data["all"] = newVar;
}

// myApp.compareGeometries(geometryList[0], geometryList[1])
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

App.prototype.addClusteringResultToDataset = function(result, name) {
	var keys = Object.keys(result);
	var keyMap = myApp._data.zz_nr.data;
	var clusteringEntry = {};
	// name = name.replace(' ', '');
	// name = name.replace('#', '');
	// name = name.replace('#', '');
	// console.log("Stripped Name: " + name);
	clusteringEntry.data = new Array(keyMap.length);
	clusteringEntry.name = name;
	clusteringEntry.invalidIndices = [];
	clusteringEntry.description = {};
	clusteringEntry.description.dataType = 'ordinal';
	clusteringEntry.description.detail = 'Clustering Result of ' +  name;
	clusteringEntry.description.dictionary = {};
	for (var i = 0; i < 20; i++)
		clusteringEntry.description.dictionary[i] = "Cluster " + i;
	clusteringEntry.description.dictionary[99999] = "no Cluster";

	for (var i = 0; i < keys.length; i++){
		var position = keyMap.indexOf(keys[i] + ""); // + "" converts to string
		clusteringEntry.data[position] = result[keys[i]] + "";
	}

	for (var i = 0; i < clusteringEntry.data.length; i++)
		if (clusteringEntry.data[i] == undefined) {
			clusteringEntry.data[i] = 99999;
			clusteringEntry.invalidIndices[i] = true;
		}

	myApp._data[name] = clusteringEntry;
	// Update CramersV Matrix
	myApp._statistics.updateCramerVMatrix(myApp._cramersVMatrix, myApp._data);
	ui.hack.appendCramersResultToDiv(name);
	// Append to Pivot Table
	//myApp._pivotTable.update([name]);

	// Now attach it to the side view
	// Cluster Position
	var position = undefined;
	for (var i = 0; i < myApp._listView._groups.length; i++)
		if (myApp._listView._groups[i].name == 'Clustering')
			position = i;
	// HACK: Remove Clustering Entry - This is due to lack of Updating in ListVIew.js
	var children = [];
	if (position != undefined) {
		children = myApp._listView._groups[position].children;
		myApp._listView._groups.pop(position);
		position = undefined;
	}
	myApp._listView.updateList();
	ui.dragging.attachDragLogic();

	if (position == undefined) {
		var clusteringGroup = {'children': children, 'name': 'Clustering', 'selected': false};
		myApp._listView._groups.push(clusteringGroup);
		position = myApp._listView._groups.length - 1;
	}

	myApp._listView._groups[position].children.push(clusteringEntry.name);
	//console.log(clusteringEntry);
}

// App.prototype.removeFaultyData = function(_data) {
// 	for (key in _data) {
// 		// Do this only if data is not metric!
// 		if (_data[key].description.dataType != 'metric') {
// 			var currentElement = _data[key];
// 			currentElement.invalidIndices = new Array();
// 			for (var j = 0; j < currentElement.data.length; j++) {
// 				var currentValue = currentElement.data[j];
// 				if (currentValue == '9 - noData' || parseFloat(currentValue) > 900 || currentValue.toString() == 'NaN') {
// 					currentElement.invalidIndices[j] = true;
// 				}
// 			}
// 		}
// 	}
// 	return _data;
// }

App.prototype.dataLoaded = function(){
	// DEBUG VIS FINAL: Aggregate data set from SHIP_T0 to data
	this._dataUntouched = this._data;
	var datakeys = Object.keys(this._data);
	for (var i = 0; i < datakeys.length; i++) {
		this._data[datakeys[i]].data = this._data[datakeys[i]].dataT0;
		if (this._data[datakeys[i]].description.cohort != 'all')
			delete this._data[datakeys[i]];
	}

	//this.constructCrossfilterDataset();
	this.createVariableForAllSubjects(); // One Variable which contains all subjects - used for clustering
	this.loadGroupDataAsync(ui.createSidebar);
	// this._pivotTable = new PivotTable('#pivotTable', this._data, ["S2_CHRO_22A", "SEX_SHIP2", "S2_ALKO_02"]);
	this._pivotTable = new PivotTable('#pivotTable', this._data);
	this._statistics.removeFaultyData(this._data);
	this._masterRenderer.calculateGlobalMean();
	console.log("Calculating bins ...");
	this._statistics.createBinsForAllMetricVariables(this._data);
	console.log("Calculating bins done");
	if (this._calculateOddsRatios) {
		console.log("Calculating Odds Ratios ...");
		this._oddsRatioTableMatrix = new OddsRatioTableMatrix(undefined, this._data);
		console.log("Calculating Odds Ratios done");
	}

	// Create Cramers V for all subjects
	if (this._saveTimeOnStartup)
		// d3.json("data/cramersVMatrix.json", function(json) {
		d3.json("data/cramersVMatrix_all.json", function(json) {
			this._cramersVMatrix = json;
		}.bind(this));
	else
		this._cramersVMatrix = this._statistics.getCramerVMatrix(this._data);

	// Create Hash Table of IDs to fast gain access for it
	this._zz_nrHash = {};
	for (var i = 0; i < this._data.zz_nr.data.length; i++)
		this._zz_nrHash[this._data.zz_nr.data[i]] = i;
}

App.prototype.loadGroupDataAsync = function(callback) {
	// var filePath = "data/ship-data/data/shipdata/groups-S2.json";
	var filePath = "data/ship-data/data/shipdata/groups_complete_all.json";
	var app = this;

	d3.json(filePath, function(groups){
		groupArray = [];
		for (var key in groups){
			var dataElement = {};
			dataElement.name = key;
			dataElement.children = groups[key];
			groupArray.push(dataElement);
		}
		app._groups = groupArray; // set group data

		// Execute Callback if defined
		if (callback != undefined)
			callback(groupArray);
	});
}

App.prototype.loadDataAsync = function(callback) {
	//var filePath = 'data/ship-data/data/shipdata/SHIP_2012_D_S2_20121129/SHIP_2012_D_S2_20121129.json';
	var filePath = 'data/ship-data/data/shipdata/SHIP_2013_combined/SHIP_2013_combined_image.json';
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
	if (type == 'dichotomous' || type == 'ordinal' || type == 'metric')
		vis = new Barchart(detail.containerId, detail.id);
	detail.visualization = vis;
	myApp._visualizations.push(detail);
	myApp._pivotTable.update([detail.id]);
}

App.prototype.removeRegisteredVisualization = function(containerId) {
		for (var i = 0; i < this._visualizations.length; i++)
			if (containerId == this._visualizations[i]['containerId'])
				this._visualizations.splice(i, 1);
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
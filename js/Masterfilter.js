// Constructor
function Masterfilter(){
	this._filter = undefined;
}

// ToDo add support for Treeviews!
Masterfilter.prototype.updateFilter = function(select) {
	console.log("Append Filter To All Visualizations.");
	console.log(select);
	//mySelection = new Filter({'SEX': ['2']});
	//myApp._visualizations[0].visualization.appendFilter(mySelection);
	
	var myFilter = new Filter(select);
	this._filter = myFilter;
	for (var i = 0; i < myApp._visualizations.length; i++) {
		if (myApp._visualizations[i].visualization.type == "Barchart") {
			myApp._visualizations[i].visualization.appendFilter(myFilter);
		}
	}
}
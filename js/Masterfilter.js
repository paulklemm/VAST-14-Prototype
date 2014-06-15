// Constructor
function Masterfilter(){
	this._filter = undefined;
}
Masterfilter.prototype.removeFilter = function() {
	this._filter = undefined;
	console.log("removeFilter");
	for (var i = 0; i < myApp._visualizations.length; i++)
		myApp._visualizations[i].visualization.removeFilter();
}

Masterfilter.prototype.updateFilter = function(select) {
	var myFilter = new Filter(select);
	this._filter = myFilter;
	for (var i = 0; i < myApp._visualizations.length; i++)
		myApp._visualizations[i].visualization.appendFilter(myFilter);
}
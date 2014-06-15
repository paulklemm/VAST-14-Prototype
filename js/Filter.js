// Constructor
function Filter(select){
	this._select = select;
	this._data = this.filterDataset(select);
}

/* Format 
	{
		SEX: [2]
		Age: [1,3]
	}
	Example: mySelection = new Filter({'SEX': ['1'], 'Age': ['1', '3']})
*/
Filter.prototype.filterDataset = function(select) {
	// Note: This can even be faster if selection arrays are converted to hashtables
	// and replace .indexOf commands with it
	var selectionData = JSON.parse(JSON.stringify(myApp._data));
	var dataKeys = Object.keys(selectionData);
	var subjectNumber = myApp._data[dataKeys[0]].data.length;
	// Set data entries to 0 to refill them
	for (var i = 0; i < dataKeys.length; i++) {
		var variable = selectionData[dataKeys[i]];
		variable.data = [];
		if (variable.description.dataType == 'metric')
			variable.binnedData.data = [];
	}

	for (var i = 0; i < subjectNumber; i++) {
		// Check if current subject fits the selection mask
		var subjectFitsSelection = true;
		var selectionKeys = Object.keys(select);
		for (var j = 0; j < selectionKeys.length; j++) {
			currentSelectionKey = selectionKeys[j];
			if (myApp._data[currentSelectionKey].description.dataType == 'metric') {
				// Note that the binned data is always stored as Int, not as string, so we append '' to make it a string!
				if (select[currentSelectionKey].indexOf(myApp._data[currentSelectionKey].binnedData.data[i] + '') == -1)
					subjectFitsSelection = false;
			}
			else
				if (select[currentSelectionKey].indexOf(myApp._data[currentSelectionKey].data[i]) == -1)
					subjectFitsSelection = false;
		}
		// Append Element to data if it fits the selection
		if (subjectFitsSelection) {
			for (var k = 0; k < dataKeys.length; k++) {
				selectionData[dataKeys[k]].data.push(myApp._data[dataKeys[k]].data[i]);
				// Also append to binned data if it is a metric data type
				if (selectionData[dataKeys[k]].description.dataType == 'metric')
					selectionData[dataKeys[k]].binnedData.data.push(myApp._data[dataKeys[k]].binnedData.data[i]);
			}
		}
	}
	return selectionData;
}
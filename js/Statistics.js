function Statistics() {
}

Statistics.prototype.createBinsForAllMetricVariables = function(data) {
	var keys = Object.keys(data);
	for (var i = 0; i < keys.length; i++)
		if (data[keys[i]].description.dataType == 'metric')
			this.createBins(data[keys[i]], 5);
}

Statistics.prototype.createBins = function(variable, numberOfBins, debug) {
	debug = false;
	if (variable.description.dataType == 'metric') {
		// For metric variables it can be assumed that all entries of the Data Dictionary
		// stand for error Values
		// Might have to check for dictionary here
		var dictionary = variable.description.dictionary;
		// Collect valid entries in the data set
		var validEntries = [];
		variable.invalidIndices = [];
		variable.binnedData = {}; // Attach Object which holds Information about the binning
		variable.binnedData.data = [];
		// If we don't have a Dictionary, the data set is assumed to be valid
		if (dictionary == undefined) // convert entries to Float
			for (var i = 0; i < variable.data.length; i++)
				validEntries.push(parseFloat(variable.data[i]));

		else {
			// iterate over all datasets
			for (var i = 0; i < variable.data.length; i++) {
				var valueAsFloat = parseFloat(variable.data[i]);
				if (!(valueAsFloat in dictionary))
					validEntries.push(valueAsFloat);
				else
					variable.invalidIndices[i] = true;
			}
		}

		var minimum = d3.min(validEntries);
		var maximum = d3.max(validEntries);
		var binSteps = (maximum - minimum) / numberOfBins;

		// Store the infrormation about the bins
		variable.binnedData.minimum = minimum;
		variable.binnedData.maximum = maximum;
		variable.binnedData.steps = binSteps;
		variable.binnedData.binNumber = numberOfBins;

		for (var i = 0; i < variable.data.length; i++)
			if (variable.invalidIndices[i] == undefined)
				variable.binnedData.data[i] = parseInt((parseFloat(variable.data[i]) - minimum) / binSteps);

		if (debug) {
			for (var i = 0; i < variable.data.length; i++) {
				console.log("[" + i + "] Binned entry " + variable.data[i] + " to bin " + variable.binnedData.data[i]);
			}
			console.log("Binning " + variable.name + ", " + validEntries.length + "/" + variable.data.length + " entries are valid.");
			console.log("Minimum: " + minimum + ", Maximum: " + maximum + "; Binsteps: " + binSteps);
			console.log("variable.invalidIndices:");
			console.log(variable.invalidIndices);
		}
	}
}


Statistics.prototype.getCramerRankingList = function(data) {
	var variables = Object.keys(data);
	console.log(variables);
	var result = [];
	var pair = {'x': undefined, 'y': undefined, 'craimersV': 0};
	for (var i = 0; i < variables.length; i++){
		for (var j = 0; j < variables.length; j++){
			if (i != j && j > i)
			{
				var craimersV = this.getCramersV(data[variables[i]], data[variables[j]]);
				if (!isNaN(craimersV)){
					result.push({'x': variables[i], 'y': variables[j], 'craimersV': craimersV});
					if (craimersV > 0.3)
						// if (variables[j].description.detail == undefined || variables[i].description.detail == undefined)
						// 	console.log({'x': variables[i], 'y': variables[j], 'craimersV': craimersV});
						//else
							console.log({'x': variables[i], 'y': variables[j], 'craimersV': craimersV, 'xDesc': myApp._data[variables[i]].description.detail, 'yDesc': myApp._data[variables[j]].description.detail});
				}
			}
		}
	}
	console.log("Sorting ...");
	var sorted = result.sort(function(a, b) {return d3.descending(a.craimersV, b.craimersV);});
	console.log("Sorting d");
	// return result;
	return sorted;
}

Statistics.prototype.removeFaultyData = function(_data) {
	for (key in _data) {
		var currentElement = _data[key];
		// Do this only if data is not metric!
		if (currentElement.description.dataType != 'metric') {
			currentElement.invalidIndices = new Array();
			for (var j = 0; j < currentElement.data.length; j++) {
				var currentValue = currentElement.data[j];
				// TODO: This needs no be less hacky
				if (currentValue == '9 - noData' || parseFloat(currentValue) > 900 || currentValue.toString() == 'NaN') {
					currentElement.invalidIndices[j] = true;
				}
			}
		}
	}
	return _data;
}

Statistics.prototype.getDimensionsList = function(x) {
	var dimensionsListX = new Array();
	for (var i = 0; i < x.length; i++)
			if (dimensionsListX.indexOf(x[i]) === -1)
				dimensionsListX.push(x[i]);
	return dimensionsListX;
}

Statistics.prototype.getContingencyTable = function(x, y) {
	// Create Count Table (Contingency Table) which makes further calculations easier
	// The Multidimensional array will look like this:
	//          Yes     No     < y
	// ------|-------|-------|
	//  Male |  23   |  12   |
	// Female|  20   |  16   |
	//   ^
	//   x
	//
	// [0][0] = 23; [0][1] = 12; [1][0] = 20; [1][1] = 16;

	// Calculate the number of Dimensions
	var dimensionsListX = this.getDimensionsList(x);
	var dimensionsListY = this.getDimensionsList(y);

	var countTable = new Array();
	for (var i = 0; i < dimensionsListX.length; i++)
	{
		countTable[i] = new Array(dimensionsListY.length);
		for (var j = 0; j < dimensionsListY.length; j++)
			countTable[i][j] = 0;
	}
	// Now start counting
	for (var i = 0; i < x.length; i++)
	{
		var positionX = dimensionsListX.indexOf(x[i]);
		var positionY = dimensionsListY.indexOf(y[i]);
		countTable[positionX][positionY]++;
	}

	// Calculate Totals for Rows and Columns
	var rowTotals = new Array(dimensionsListX.length);
	for (var i = 0; i < dimensionsListX.length; i++)
	{
		rowTotals[i] = 0;
		for (var j = 0; j < dimensionsListY.length; j++)
		 rowTotals[i] += countTable[i][j];
	}
	var columnTotals = new Array(dimensionsListY.length);
	for (var i = 0; i < dimensionsListY.length; i++)
	{
		columnTotals[i] = 0;
		for (var j = 0; j < dimensionsListX.length; j++)
		 columnTotals[i] += countTable[j][i];
	}

	return {"countTable": countTable,
					"rowTotals": rowTotals, 
					"columnTotals": columnTotals,
					"dimensionsListX": dimensionsListX,
					"dimensionsListY": dimensionsListY};
}

Statistics.prototype.getOddsRatioTableDifference = function(tableX, tableY) {
	var difference = 0;

	var elementsAreMissing = false;
	if (tableX.length != tableY.length || tableX[0].length != tableY[0].length)
		elementsAreMissing = true;

	var lengthX = 0;
	var lengthY = 0;
	if (tableX.length < tableY.length)
		lengthX = tableX.length;
	else 
		lengthX = tableY.length;
	if (tableX[0].length < tableY[0].length)
		lengthY = tableX[0].length;
	else 
		lengthY= tableY[0].length;

	// for (var i = 0; i < tableX.length; i++)
	// 	for (var j = 0; j < tableX[i].length; j++)
	for (var i = 0; i < lengthX; i++)
		for (var j = 0; j < lengthY; j++)
			difference = difference + Math.abs(tableX[i][j] - tableY[i][j]);

	// var numberOfElements = tableX.length * tableX[0].length;
	var numberOfElements = tableX * lengthY;
	return { "difference": difference / numberOfElements, "elementsAreMissing": elementsAreMissing};
}

Statistics.prototype.getOddsRatioTable = function(x, y, debug) {
	var matchingValidData = this.getValidMatchingData(x, y);
	var variableXValid = matchingValidData.variableXValid;
	var variableYValid = matchingValidData.variableYValid;

	var contingency = this.getContingencyTable(variableXValid, variableYValid);
	
	var countTable = contingency.countTable;
	var rowTotals = contingency.rowTotals;
	var columnTotals = contingency.columnTotals;
	var dimensionsListX = contingency.dimensionsListX;
	var dimensionsListY = contingency.dimensionsListY;

	if (dimensionsListX.length > 50) {
		console.log(x.name + " has more than 50 elements (" + dimensionsListX.length + "). Aborting Ration Table caluclation");
		return;
	}
		if (dimensionsListY.length > 50) {
		console.log(x.name + " has more than 50 elements (" + dimensionsListY.length + "). Aborting Ration Table caluclation");
		return;
	}

	var oddsRatioTableDimensionX = 0;
	var oddsRatioTableDimensionY = 0;
	// Dimension is sum of Dimension length - 1
	// For Example: Dimension = 4. Table Length is 3 + 2 + 1 = 6
	for (var i = 1; i < dimensionsListX.length; i++)
		oddsRatioTableDimensionX = oddsRatioTableDimensionX + i;
	for (var i = 1; i < dimensionsListY.length; i++)
		oddsRatioTableDimensionY = oddsRatioTableDimensionY + i;
	
	var oddsRatioTable = new Array(oddsRatioTableDimensionX);
	for (var i = 0; i < oddsRatioTableDimensionX; i++)
		oddsRatioTable[i] = new Array(oddsRatioTableDimensionY);

	if (debug) {
		console.log(" --- Get odds Ratio ---");
		console.log(" Odds Ratio Table Dimension X: " + oddsRatioTableDimensionX);
		console.log(" Odds Ratio Table Dimension Y: " + oddsRatioTableDimensionY);
	}

	tablePositionX = -1;
	tablePositionY = -1;

	for (var x1 = 0; x1 < dimensionsListX.length; x1++) {
		for(var x2 = 0; x2 < dimensionsListX.length; x2++) {
			if (x1 != x2 && x2 > x1) {
				tablePositionX = tablePositionX + 1;
				tablePositionY = -1;
				for (var y1 = 0; y1 < dimensionsListY.length; y1++) {
					for(var y2 = 0; y2 < dimensionsListY.length; y2++) {
						if (y1 != y2 && y2 > y1) {
							tablePositionY = tablePositionY + 1;
							//          Yes     No     < y
							// ------|-------|-------|
							//  Male |  23   |  12   |
							// Female|  20   |  16   |
							//   ^
							//   x
							// Odds Ratio = 23 * 16 / 20 * 12
							var oddRatio = (countTable[x1][y1] * countTable[x2][y2]) / (countTable[x1][y2] * countTable[x2][y1]);
							oddsRatioTable[tablePositionX][tablePositionY] = oddRatio;

							if (debug) {
								console.log("x1: " + dimensionsListX[x1] + ", x2: " + dimensionsListX[x2] + "; y1: " + dimensionsListY[y1] + ", y2: " + dimensionsListY[y2]);
								console.log("[" + tablePositionX + ";" + tablePositionY + "] (" + countTable[x1][y1] + " * " + countTable[x2][y2] + ") / (" + countTable[x2][y1] + " * " + countTable[x1][y2] + ") = " + oddRatio);
							}
						}
					}
				}
			}
		}
	}
	return oddsRatioTable;
}

// Both Variables need to have the same dimensions!
Statistics.prototype.calculateChiSquare = function(x, y, debug, yatesCorrection, returnPValue)
{
	// https://onlinecourses.science.psu.edu/stat500/node/56
	// Null Hypothesis will be that the categrorical variables are independent
	// Χ²=∑(O−E)² / E
	// E = (row total × column total) / sample size

	var contingency = this.getContingencyTable(x, y);
	
	var countTable = contingency.countTable;
	var rowTotals = contingency.rowTotals;
	var columnTotals = contingency.columnTotals;
	var dimensionsListX = contingency.dimensionsListX;
	var dimensionsListY = contingency.dimensionsListY;
	
	if (debug){
		console.log("Chi-Square-CountTable");
		console.log(countTable);
		console.log("Row totals");
		console.log(rowTotals);
		console.log("Column totals");
		console.log(columnTotals);
	}

	var sampleSize = x.length;
	// We have our Data Table, let's apply the formula to it

	// Apply Chi Square Formula
	var chiSquare = 0;
	// Also check for the suitability (http://www.quantpsy.org/chisq/chisq.htm)
	var suitability = new Object();
	suitability.isSuitable = true;
	suitability.expectedSmallerFiveCount = 0;
	suitability.reason = "";

	for (var i = 0; i < dimensionsListX.length; i++)
	{
		for(var j = 0; j < dimensionsListY.length; j++)
		{
			// E = (row total × column total) / sample size
			var E = (rowTotals[i] * columnTotals[j]) / sampleSize;
			if (E < 1 && suitability.isSuitable) {
				suitability.isSuitable = false;
				suitability.reason += "One expected Value is smaller than one! ";
			}
			if (E < 5) // if expected Value is smaller than five, increase the counter
				suitability.expectedSmallerFiveCount++;
			// Yates Correction can only be applied for 2x2 contingency tables!
			// Χ²=∑(O−E)² / E
			if (yatesCorrection == true)
				 //Χ²yates=∑(|O−E| - 0.5)² / E
				chiSquare += Math.pow(Math.abs(countTable[i][j] - E) - 0.5, 2) / E
			else
				chiSquare += Math.pow(countTable[i][j] - E, 2) / E
		}
	}

	var degreesOfFreedom = (dimensionsListX.length - 1) * (dimensionsListY.length - 1);
	var pValue = this.calculatePValue(degreesOfFreedom, chiSquare)

	// When Expected Value is smaller than 5 in 20% of the cells, mark test inappropriate
	suitability.percentOfExpectedSmallerFive = (suitability.expectedSmallerFiveCount / (dimensionsListX.length * dimensionsListY.length)) * 100;
	if (suitability.percentOfExpectedSmallerFive >= 20) {
		suitability.isSuitable = false;
		suitability.reason +=  suitability.percentOfExpectedSmallerFive + "% of expected Values are smaller than 5";
	}

	//if (!suitability.isSuitable && pValue < 0.01 && pValue != 0 && debug)
		console.log(suitability.reason + "; pValue: " + pValue);

	if (suitability.isSuitable) {
		if (returnPValue)
			return pValue;
		else
			return chiSquare;
	}
}

Statistics.prototype.testOddsRatioWithAllVariables = function(data) {
	var variables = Object.keys(data);
	var result = [];
	for (var i = 0; i < variables.length; i++){
		for (var j = 0; j < variables.length; j++){
			// console.log("Calculating "+ data[variables[i]].name + " with " + data[variables[j]].name);
			if (i != j && j > i) {
				if (data[variables[i]].name != "GEBURTSTAG_SHIP2" && data[variables[j]].name != "GEBURTSTAG_SHIP2"){
					var oddsTable = this.getOddsRatioTable(data[variables[i]], data[variables[j]]);
					result.push({'x': variables[i], 'y': variables[j], 'oddsTable': oddsTable});
				}
			}
		}
		// console.log("Calculating "+ data[variables[i]].name + " done");
	}
	console.log(result);
	// TODO HIER WEITERMACHEN!
}
// ToDo This is broken
Statistics.prototype.testOddsRatio = function(x, y) {
	var variableXValid = new Array();
	var variableYValid = new Array();

	for (var k = 0; k < x.data.length; k++) {
		if (x.invalidIndices[k] == undefined && y.invalidIndices[k] == undefined)
		{
			if(x.description.dataType == 'metric') {
				variableXValid.push((x.binnedData.data[k]).toString());
			}
			else
				variableXValid.push(x.data[k]);
			
			if(y.description.dataType == 'metric') {
				variableYValid.push((y.binnedData.data[k]).toString());
			}
			else
				variableYValid.push(y.data[k]);
		}
	}
	// Only every second Element!
	var variableXValid2 = new Array();
	var variableYValid2 = new Array();

	for (var k = 0; k < x.data.length; k++) {
		if (k % 2 == 1) {
			if (x.invalidIndices[k] == undefined && y.invalidIndices[k] == undefined)
			{
				if(x.description.dataType == 'metric') {
					variableXValid2.push((x.binnedData.data[k]).toString());
				}
				else
					variableXValid2.push(x.data[k]);
				
				if(y.description.dataType == 'metric') {
					variableYValid2.push((y.binnedData.data[k]).toString());
				}
				else
					variableYValid2.push(y.data[k]);
			}
		}
	}

	console.log("variableXValid.length:  " + variableXValid.length);
	console.log("variableYValid.length:  " + variableYValid.length);
	console.log("variableXValid2.length: " + variableXValid2.length);
	console.log("variableYValid2.length: " + variableYValid2.length);
	console.log("variableXValid");
	console.log(variableXValid);
	console.log("variableYValid");
	console.log(variableYValid);
	console.log("variableXValid2");
	console.log(variableXValid2);
	console.log("variableYValid2");
	console.log(variableYValid2);
	var oddsTable1 = this.getOddsRatioTable(variableXValid, variableYValid, false);
	var oddsTable2 = this.getOddsRatioTable(variableXValid2, variableYValid2, false);
	console.log("oddsTable1");
	console.log(oddsTable1);
	console.log("oddsTable2");
	console.log(oddsTable2);
	var oddsTableDifference = this.getOddsRatioTableDifference(oddsTable1, oddsTable2);
	console.log("oddsTableDifference: " + oddsTableDifference.difference + ", Elements are missing: " + oddsTableDifference.elementsAreMissing);
}

Statistics.prototype.getValidMatchingData = function(x, y) {
	var variableXValid = [];
	var variableYValid = [];

	for (var k = 0; k < x.data.length; k++) {
		if (x.invalidIndices[k] == undefined && y.invalidIndices[k] == undefined)
		{
			if(x.description.dataType == 'metric') {
				variableXValid.push((x.binnedData.data[k]).toString());
			}
			else
				variableXValid.push(x.data[k]);
			
			if(y.description.dataType == 'metric') {
				variableYValid.push((y.binnedData.data[k]).toString());
			}
			else
				variableYValid.push(y.data[k]);
		}
	}

	return {"variableXValid": variableXValid, "variableYValid": variableYValid}
}

Statistics.prototype.getCramersV = function(x, y, debug) {
	
	var matchingValidData = this.getValidMatchingData(x, y);
	var variableXValid = matchingValidData.variableXValid;
	var variableYValid = matchingValidData.variableYValid;

	//https://de.wikipedia.org/wiki/Kontingenzkoeffizient
	var chiSquareCoefficient = this.calculateChiSquare(variableXValid, variableYValid, false, false);
	// n: Gesamtzahl der Fälle (Stichprobenumfang)
	var n = variableXValid.length;
	// min[r,c] ist der kleinere der beiden Werte "Zahl der Zeilen (rows)" und "Zahl der Spalten (columns)"
	var lengthX = this.getDimensionsList(variableXValid).length;
	var lengthY = this.getDimensionsList(variableYValid).length;
	var minLength = 0;
	if (lengthX < lengthY)
		minLength = lengthX;
	else
		minLength = lengthY;

	if (debug) {
		console.log("x: " + x.name);
		console.log("y: " + y.name);
		console.log(variableXValid);
		console.log(variableYValid);
		console.log("chiSquareCoefficient: " + chiSquareCoefficient);
		console.log("variableXValid.length: " + variableXValid.length);
		console.log("variableYValid.length: " + variableYValid.length);
	}

	return Math.sqrt(chiSquareCoefficient / (n * (minLength - 1)));
}

// http://www.codeproject.com/Articles/432194/How-to-Calculate-the-Chi-Squared-P-Value
Statistics.prototype.calculatePValue = function(Dof, Cv)
{
	if (Cv < 0 || Dof < 1)
	{
		return 0.0;
	}
	var K = Dof * 0.5;
	var X = Cv * 0.5;
	if (Dof === 2)
	{
		return Math.exp(-1.0 * X);
	}
	var PValue = this.helperIgf(K, X);
	if (isNaN(PValue) || PValue <= 1e-8)
	{
		return 1e-14;
	}

	PValue /= this.helperGamma(K);
	return (1.0 - PValue);
}

Statistics.prototype.helperIgf = function(S, Z)
{
	if (Z < 0.0)
	{
		return 0.0;
	}
	var Sc = (1.0 / S);
	Sc *= Math.pow(Z, S);
	Sc *= Math.exp(-Z);
	var Sum = 1.0;
	var Nom = 1.0;
	var Denom = 1.0;
	for (var I = 0; I < 200; I++)
	{
		Nom *= Z;
		S++;
		Denom *= S;
		Sum += (Nom / Denom);
	}
	return Sum * Sc;
}

Statistics.prototype.helperGamma = function(N)
{
	var A = 15
	var SQRT2PI = 2.5066282746310005024157652848110452530069867406099383;

	var Z = N;
	var Sc = Math.pow((Z + A), (Z + 0.5));
	Sc *= Math.exp(-1.0 * (Z + A));
	Sc /= Z;

	var F = 1.0;
	var Ck;
	var Sum = SQRT2PI;

	for (var K = 1; K < A; K++)
	{
		Z++;
		Ck = Math.pow(A - K, K - 0.5);
		Ck *= Math.exp(A - K);
		Ck /= F;

		Sum += (Ck / Z);

		F *= (-1.0 * K);
	}

	return Sum * Sc;
}
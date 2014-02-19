function Statistics() {
}

// Statistics.prototype.createBins = function(data, variable) {
// 	if (data[variable].description.dataType == 'metric') {
// 		// For metric variables it can be assumed that all entries of the Data Dictionary
// 		// stand for error values

		
// 	}
// }

Statistics.prototype.getCraimerRankingList = function(data) {
	var variables = Object.keys(data);
	console.log(variables);
	var result = [];
	var pair = {'x': undefined, 'y': undefined, 'craimersV': 0};
	for (var i = 0; i < variables.length; i++){
		for (var j = 0; j < variables.length; j++){
			if (i != j && j > i)
			{
				var craimersV = this.getCraimersV(data[variables[i]], data[variables[j]]);
				if (!isNaN(craimersV)){
					result.push({'x': variables[i], 'y': variables[j], 'craimersV': craimersV});
					if (craimersV > 0.5)
						console.log({'x': variables[i], 'y': variables[j], 'craimersV': craimersV});
				}

			}
		}
	}
	return result;
}

Statistics.prototype.removeFaultyData = function(_data) {
	for (key in _data) {
		var currentElement = _data[key];
		currentElement.invalidIndices = new Array();
		for (var j = 0; j < currentElement.data.length; j++) {
			var currentValue = currentElement.data[j];
			// TODO: This needs no be less hacky
			if (currentValue == '9 - noData' || parseFloat(currentValue) > 900 || currentValue.toString() == 'NaN') {
				currentElement.invalidIndices[j] = true;
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

// Both Variables need to have the same dimensions!
Statistics.prototype.calculateChiSquare = function(x, y, debug, yatesCorrection, returnPValue)
{
	// https://onlinecourses.science.psu.edu/stat500/node/56
	// Null Hypothesis will be that the categrorical variables are independent
	// Χ²=∑(O−E)² / E
	// E = (row total × column total) / sample size

	// Calculate the number of Dimensions
	var dimensionsListX = this.getDimensionsList(x);
	var dimensionsListY = this.getDimensionsList(y);
	// var dimensionsListX = new Array();
	// var dimensionsListY = new Array();
	// for (var i = 0; i < x.length; i++)
	// 	if (dimensionsListX.indexOf(x[i]) === -1)
	// 		dimensionsListX.push(x[i]);
	// for (var i = 0; i < y.length; i++)
	// 	if (dimensionsListY.indexOf(y[i]) === -1)
	// 		dimensionsListY.push(y[i]);

	// Create Count Table which makes further calculations easier
	// The Multidimensional array will look like this:
	//          Yes     No     < y
	// ------|-------|-------|
	//  Male |  23   |  12   |
	// Female|  20   |  16   |
	//   ^
	//   x
	//
	// [0][0] = 23; [0][1] = 12; [1][0] = 20; [1][1] = 16;
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
	var sampleSize = x.length;
	if (debug){
		console.log("Chi-Square-CountTable");
		console.log(countTable);
	}
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
	if ( suitability.percentOfExpectedSmallerFive >= 20) {
		suitability.isSuitable = false;
		suitability.reason +=  suitability.percentOfExpectedSmallerFive + "% of expected Values are smaller than 5";
	}

	if (!suitability.isSuitable && pValue < 0.01 && pValue != 0 && debug){
		console.log(suitability.reason + "; pValue: " + pValue);
	}
	if (suitability.isSuitable) {
		if (returnPValue)
			return pValue;
		else
			return chiSquare;
	}
}

Statistics.prototype.getCraimersV = function(x, y) {
	var variableXValid = new Array();
	var variableYValid = new Array();

	for (k = 0; k < x.data.length; k++) {
		if (x.invalidIndices[k] == undefined && y.invalidIndices[k] == undefined)
		{
			variableXValid.push(x.data[k]);
			variableYValid.push(y.data[k]);
		}
	}

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

	return Math.sqrt(chiSquareCoefficient / n * (minLength - 1));
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
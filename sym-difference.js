// input: PV - global PI Visualization object
(function (PV) {
	"use strict";//strict mode usage
	function symbolVis() { };//create a symbol
	PV.deriveVisualizationFromBase(symbolVis);
	var definition = {//definition - create visualization object 
		typeName: "difference",//links js with html
		visObjectType: symbolVis,
		datasourceBehavior: PV.Extensibility.Enums.DatasourceBehaviors.Multiple,
		getDefaultConfig: function(){ 
			return { 
				DataShape: 'Timeseries',//takes single value from multiple tags
				Height: 400,
				Width: 600
			} 
		}
	}
	//returns config for the Chart
	function getConfig(valueAxesTitle){
		return {
			"type": "serial",
			"categoryField": "category",
			"startDuration": 1,
			"categoryAxis": {
				"gridPosition": "start"
			},
			"trendLines": [],
			"graphs": [
				{
					"balloonText": "[[title]] on [[category]]:[[value]]",
					"fillAlphas": 1,
					"id": "AmGraph-1",
					"title": "lowest value",
					"type": "column",
					"valueField": "column-1"
				},
				{
					"balloonText": "[[title]] on [[category]]:[[value]]",
					"fillAlphas": 1,
					"id": "AmGraph-2",
					"title": "difference",
					"type": "column",
					"valueField": "column-2"
				}
			],
			"guides": [],
			"valueAxes": [
				{
					"id": "ValueAxis-1",
					"stackType": "regular",
					"title": valueAxesTitle
				}
			],
			"allLabels": [],
			"balloon": {},
			"legend": {
				"enabled": true,
				"useGraphSettings": true
			},
			"dataProvider": []
		}
	}
	//add logic to do smthng on startup
	symbolVis.prototype.init = function(scope, elem) { 
		var container = elem.find('#container')[0];//link div with container id to Chart container
		container.id = "barChart_" + scope.symbol.Name;//set unique name for Chart container
		var chart = null;//create Chart
		var isInitialData = true; //to perform action only once

		var dataByTime = [];
		var lastTime = [];
		//creates time based category for Chart
		function convertToChart(time,lowestValue,difference){
			return {
					"category": time,
					"column-1": lowestValue,
					"column-2": difference
				}
			
		}
		//creates Title for Chart
		function updateTitle(label1, label2){
			return [{
					text: 'Difference between ' + label1 + ' and ' + label2
				}]
		}
		//link dataUpdate function to event onDataUpdate
		this.onDataUpdate = dataUpdate;
		function dataUpdate(data){
			if(!data)return;//mandatory, since initially data is null

			var firstAttribute = data.Data[0];
			var secondAttribute = data.Data[1];

			if(!data.Data[1]){//at least two attributes shall be selected
					console.log('Use 2 attributes');
					scope.Container = 'Use 2 attributes!';
				return;
			}
			//sporadic updates
			if(firstAttribute.Label){
				
				if(firstAttribute.Units != secondAttribute.Units) {
					console.log('Units shall be equal');
					scope.Container = 'Units shall be equal!';
					return;
				}
				//avoid similar data
				var time = data.Data[0].Values[data.Data[0].Values.length-1].Time;
				if(time==lastTime) return;
				lastTime = time;
				//perform only once, to get data for chart initialization
				if( isInitialData ){
					chart = AmCharts.makeChart(container.id, getConfig(firstAttribute.Units));//initialize chart with unit as axis title
					var title = updateTitle(firstAttribute.Label, secondAttribute.Label);
					chart.titles = title;//update title
					scope.Label1 = firstAttribute.Label;
					scope.Label2 = secondAttribute.Label;
					isInitialData = false;
				}
				//set new data for chart
				var length = firstAttribute.Values.length;
				var firstValue = data.Data[0].Values[data.Data[0].Values.length-1].Value;
				var secondValue = data.Data[1].Values[data.Data[1].Values.length-1].Value;
				var lowestValue = firstValue<secondValue?secondValue:firstValue;
				var highestValue = firstValue>secondValue?secondValue:firstValue;
				var difference = highestValue-lowestValue;
				var dataprovider = convertToChart(time, lowestValue, difference);
				chart.dataProvider.push(dataprovider);
				//update chart
				chart.validateData();
				dataByTime.push({time:time,firstValue:firstValue,secondValue:secondValue,difference:difference});
				scope.dataByTime = dataByTime;
			} else return;
		}
	};
	PV.symbolCatalog.register(definition); //register a symbol to show it when load up, add the symbol registration to PI Vision symbol catalog initialization.
})(window.PIVisualization);//all PI Vision symbols should be wrapped in an immediately-invoked function expression (IIFE)

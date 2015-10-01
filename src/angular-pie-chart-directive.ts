/**
 * <h3>AngularJS directive for showing a pie chart</h3>
 * This directive uses D3 library to draw a pie chart
 * @example <caption>Jade example</caption>
 * angular-pie-chart(
 *      chart-id="'test-chart'",
 *      dataset="[{'label':'test1', 'value':20},{'label':'test2', 'value':30}]",
 *      width="500",
 *      height="360",
 *      colors="['#ff0000','#ffff00']")
 */

module Graphs {
    "use strict";

    export interface PieChartDirectiveScope extends ng.IScope {
        // Add unique Chart ID to separate
        chartId: string;
        // Data to be displayed; array of { label: string, value: number }
        dataset: {
            label: string;
            value: number;
        }[];
        // Chart width: Note that you need to add some space for legends also
        width: number;
        // Chart height: This is the height of the pie
        height: number;
        // SVG object
        svg: any;
        // D3 pie chart object
        pie: any;
        // D3 pie arc object
        arc: any;
        // Combined sum of values to be used in percentage counting
        totalValue: number;
        // Pie radius
        radius: number;
        // Pie / donut inner radius
        cropRadius: number;
        // Position for segment percentage fields
        radiusForTextLabel: number;
        // Colors for segments
        colors: string[];
        // SVG path object
        path: any;
    }
}

angular.module("graphs", [])
    .directive("angularPieChart", ["$compile",
        ($compile: ng.ICompileService) => {
            "use strict";

            // Size and spacing for legend boxes
            var legendRectSize = 18;
            var legendSpacing = 4;

            /**
             * Create random hex number
             * @returns {string} two digit hex
             */
            var getRandomHexNumber = (): string => {
                var hex: string = Math.round(Math.random() * 255).toString(16);
                if (hex.length < 2) {
                    hex = "0" + hex;
                }
                return hex;
            };

            /**
             * Create random color code
             * @returns {string} Hex color code
             */
            var getRandomColor = (): string => {
                return "#" + getRandomHexNumber() + getRandomHexNumber() + getRandomHexNumber();
            };

            /**
             * Create pie chart object
             */
            var createPie = (scope: Graphs.PieChartDirectiveScope) => {
                // Clear SVG
                d3.select('#' + scope.chartId).remove();
                // Create SVG object
                scope.svg = d3.select('#piechart')
                    .append('svg')
                    .attr('width', scope.width)
                    .attr('height', scope.height)
                    .attr('id', scope.chartId)
                    .append('g')
                    // Use height in both translations because height defines the radius of pie
                    .attr('transform', 'translate(' + (scope.height / 2) + ',' + (scope.height / 2) + ')');

                // Define pie size
                scope.arc = d3.svg.arc()
                    .innerRadius(scope.radius - scope.cropRadius)
                    .outerRadius(scope.radius);

                // Create pie object
                scope.pie = d3.layout.pie()
                    .value((dataObject: any) => { return dataObject.value; })
                    .sort(null);
            };

            /**
             * Draw pie chart segments
             */
            var drawSegments = (scope: Graphs.PieChartDirectiveScope) => {
                // Create paths to SVG
                if (scope.totalValue > 0) {
                    scope.path = scope.svg.selectAll('path')
                        .data(scope.pie(scope.dataset))
                        .enter()
                        .append('path')
                        .attr('d', scope.arc)
                        .attr('fill', (dataObject: any, ordinal: number) => {
                            return scope.colors[ordinal];
                        });
                } else {
                    scope.path = scope.svg.selectAll('path')
                        .data(scope.pie([{ label: "", value: 1 }]))
                        .enter()
                        .append('path')
                        .attr('d', scope.arc)
                        .attr('fill', (dataObject: any, ordinal: number) => {
                            return "#CCCCCC";
                        });
                }
            };

            /**
             * Draw percentage label texts on top of segments
             */
            var drawLabels = (scope: Graphs.PieChartDirectiveScope) => {
                var slice = scope.svg.selectAll('.angular-pie-chart-label')
                    .data(scope.pie(scope.totalValue > 0 ? scope.dataset : [{ label: "", value: 1 }]))
                    .enter()
                    .append('text')
                    .attr('class', 'angular-pie-chart-label')
                    .attr('x', (dataObject: any, ordinal: number) => {
                        // Place label in middle of segment
                        var sliceAngle = dataObject.startAngle + (dataObject.endAngle - dataObject.startAngle) / 2;
                        // Count label x-position by turning radius in circle. 15 is approximately half of label width
                        return scope.radiusForTextLabel * Math.sin(sliceAngle) - 15;
                    })
                    .attr('y', (dataObject: any, ordinal: number) => {
                        // Place label in middle of segment
                        var sliceAngle = dataObject.startAngle + (dataObject.endAngle - dataObject.startAngle) / 2;
                        // Count label y-position by turning radius in circle. 6 is approximately half of label height
                        return -scope.radiusForTextLabel * Math.cos(sliceAngle) + 6;
                    })
                    .text((dataObject: any) => {
                        if (scope.totalValue > 0) {
                            return Math.round(dataObject.value / scope.totalValue * 100) + "%";
                        } else {
                            return "";
                        }
                    });
            };

            /**
             * Draw legends that describe the different segments in pie
             */
            var drawLegends = (scope: Graphs.PieChartDirectiveScope) => {
                if (scope.totalValue > 0) {
                    // Add group to combine legend box and text and move it to right bottom corner
                    var legend = scope.svg.selectAll('.legend')
                        .data(scope.dataset.map(dataObject => dataObject.label))
                        .enter()
                        .append('g')
                        .attr('class', 'legend')
                        .attr('transform', (dataObject: any, ordinal: number) => {
                            var legendSize = legendRectSize + legendSpacing;
                            var offset =  legendSize * scope.dataset.length;
                            var horz = scope.height / 2 + legendRectSize; // Height defines the radius fo pie
                            var vert = ordinal * legendSize + scope.height / 2 - offset - legendSpacing;
                            return 'translate(' + horz + ',' + vert + ')';
                        });

                    // Create legend color box
                    legend.append('rect')
                        .attr('width', legendRectSize)
                        .attr('height', legendRectSize)
                        .style('fill', (dataObject: any, ordinal: number) => {
                            return scope.colors[ordinal];
                        })
                        .style('stroke', (dataObject: any, ordinal: number) => {
                            return scope.colors[ordinal];
                        });

                    // Create legend text
                    legend.append('text')
                        .attr('x', legendRectSize + legendSpacing * 2)
                        .attr('y', legendRectSize - legendSpacing)
                        .text((labelText: string) => { return labelText; });
                }
            };

            /**
             * Draw complete pie chart
             */
            var drawChart = (scope: Graphs.PieChartDirectiveScope) => {
                // Combined sum of values to be used in percentage counting
                scope.totalValue = 0;
                scope.dataset.map(dataObject => scope.totalValue += dataObject.value);
                // Pie radius
                scope.radius = Math.min(scope.width, scope.height) / 2;
                // Pie / donut inner radius
                scope.cropRadius = scope.radius * 0.35;
                // Position for segment percentage fields
                scope.radiusForTextLabel = scope.radius - (scope.radius - scope.cropRadius) / 3.5;
                // Create pie object
                createPie(scope);
                // Draw pie chart segments
                drawSegments(scope);
                // Draw percentage labels
                drawLabels(scope);
                // Draw legends
                drawLegends(scope);
            };

            /**
             * AngularJS linker function
             * @param {Graphs.PieChartDirectiveScope} scope AngularJS scope
             * @param {JQuery} element AngularJS element to be linked
             * @param {ng.IAttributes} attrs AngularJS attributes
             */
            var linkerFunction = (scope: Graphs.PieChartDirectiveScope, element: JQuery, attrs: ng.IAttributes) => {

                // Check colors
                if (!scope.colors) {
                    scope.colors = [];
                    scope.dataset.map(() => {
                        scope.colors.push(getRandomColor());
                    });
                }

                // Draw chart once on load
                drawChart(scope);

                /**
                 * Watch for changes in dataset, width and height
                 */
                scope.$watchGroup(["dataset", "width", "height"], () => {
                    if (scope.dataset) {
                        drawChart(scope);
                    }
                });

            };

            return {
                template: "<div id='piechart' class='angular-pie-chart'></div>",
                restrict : "E",
                scope : {
                    chartId: "=",
                    dataset: "=",
                    width: "=",
                    height: "=",
                    colors: "="
                },
                link: linkerFunction
            };
        }]);

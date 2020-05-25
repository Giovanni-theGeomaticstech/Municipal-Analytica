require([
        "Javascript/geolocate.js",
        "esri/widgets/Track",
        "esri/Map",
        "esri/views/MapView",
        //"esri/views/SceneView",
        "esri/layers/Layer",
        "esri/layers/FeatureLayer",
        "esri/Graphic",
        "esri/geometry/geometryEngine",
        "esri/geometry/Polyline",
        "esri/geometry/Polygon",
        "esri/geometry/Multipoint",
        "esri/geometry/Point",
        "esri/widgets/ScaleBar",
        "esri/symbols/SimpleMarkerSymbol",
        "Javascript/turf_functions.js"


        //"/Javascript/geolocate_track.js"
        //,
        //"/Javascript/test.js" //call another js file into my program
    ],
    function (geolocate, Track, Map, MapView, /* SceneView,*/ Layer, FeatureLayer, Graphic, geometryEngine, Polyline, Polygon, Multipoint, Point,
        ScaleBar, SimpleMarkerSymbol) {
        
        var map = new Map({
            basemap: "dark-gray-vector"
        });

        var view = new MapView({
            container: "viewDiv",
            map: map,
            center: [-80.5204, 43.4643], //[-97.06326, 32.759], 
            zoom: 15,
            ui: {
                components: ["attribution"] // replace default set of UI components
            }
        });


        //November 16th Here i actually got the geometry
        //////////////////////////////Global Variables////////////////////////////////////////////
        //Global Variables 

        var Feature_name; //Names of the features being used 
        var Feature_list; // The dictionary of the geometries
        var Feature_coords; // Stores the coordinates of all the geometries for ease of access
        var locater; // stores coordinates of the intersection
        var inter_points; // stores as a multipoint all the points created from an intersection
        var buffered_features = []; // the buffered features
        var locater; // This variable stores all the coordinates of the intersection
        var track_route; // The routes between two intersections
        var layer;

        ///////////////////////////////////////////////////////////////////////////
        //November 25, 2019
        //Here going to initialize everything

        ////////////////////////////////Create Geometry///////////////////////////////////////////
        //This function createGeometry receives the users coordinates and feature type
        //Requires coordinates to be an Array of numbers and type a string
        //The function returns either a polyline,polygon,point, multipoint or an error
        function createGeometry(coords, type) {
            if (type == 'polyline') { //For polyline layers
                var polyline = new Polyline({
                    hasZ: false,
                    hasM: false,
                    paths: coords,
                    spatialReference: {
                        wkid: 102100
                    },
                    type: 'polyline'
                });
                return polyline
            } //Now for polygon
            else if (type == 'polygon') {
                var polygon = new Polygon({
                    hasZ: false,
                    hasM: false,
                    rings: coords,
                    spatialReference: {
                        wkid: 102100
                    },
                    type: 'polygon'
                });
                return polygon
            } // Now for point
            else if (type == 'multipoint') {
                var point = new Multipoint({
                    hasZ: false,
                    hasM: false,
                    points: coords,
                    spatialReference: {
                        wkid: 102100
                    },
                    type: 'multipoint'
                });
                return point
            } else if (type == 'point') {
                var point = {
                    type: "point", // autocasts as new Point()
                    longitude: coords[0],
                    latitude: coords[1],
                    spatialReference: {
                        wkid: 102100
                    },
                };
                return new Point(point)
            } else {
                return 'Error no Geometry'
            }
        }
        ///////////////////////////////////////////////////////////////////////////


        ///////////////////////////////////Symbology////////////////////////////////////////
        //Function symbology consumes a string type which loads the symbology representation
        //For the Geometry to be used 

        function symbology(type) {
            // Create a simple line symbol for rendering the line in the view
            //Possibly for the route of the car
            var lineSymbol = {
                type: "simple-line", // autocasts as new SimpleLineSymbol()
                color: [0, 0, 255, 0.4], // RGB color values as an array
                width: 4
            };

            // Create a symbol for drawing the point
            var markerSymbol = {
                type: "simple-marker", // autocasts as new SimpleMarkerSymbol()
                color: [255, 0, 0],
                outline: {
                    // autocasts as new SimpleLineSymbol()
                    color: [255, 255, 255],
                    width: 1
                }
            };


            // Create a symbol for rendering a polygon graphic
            var fillSymbol = {
                type: "simple-fill", // autocasts as new SimpleFillSymbol()
                color: [227, 139, 79, 0.8],
                outline: {
                    // autocasts as new SimpleLineSymbol()
                    color: [255, 255, 255],
                    width: 1
                }
            };

            if (type == 'point' || type == "multipoint") {
                return markerSymbol
            } else if (type == "polygon") {
                return fillSymbol
            } else if (type == "polyline") {
                return lineSymbol
            }
        }
        ///////////////////////////////////////////////////////////////////////////

        ///////////////////////////////Add to Graphics Layer////////////////////////////////////////////
        //Note the function uiAddGraphics consumes a geometry element 
        function uiAddGraphics(geometry, symbology) {
            if (geometry && symbology) {
                var graphic_element = new Graphic({
                    geometry: geometry,
                    symbol: symbology
                });
                view.graphics.add(graphic_element)
                return graphic_element
            }

        }
        ///////////////////////////////////////////////////////////////////////////

        /////////////////////////////Local storage retrieval//////////////////////////////////////////////
        function local_receiver() { //run this function on load

            Feature_name = JSON.parse(localStorage.getItem('Feature_name'));
            Feature_list = JSON.parse(localStorage.getItem('Features'));
            Feature_coords = JSON.parse(localStorage.getItem('Features'));
            //Create Divs for each of the added features 

            for (var i = 0; i < Feature_name.length; ++i) {
                var featname = Feature_name[i]
                var feature_type = Feature_list[featname][1]
                var feat_crds = Feature_list[featname][0]
                Feature_list[featname] = createGeometry(feat_crds, feature_type);
            }
        }
        local_receiver()

        ///////////////////////////////////////////////////////////////////////////


        ////////////////////////////Intersection Tool//////////////////////////////////////////////
        //The function intersect_features consumes 
        //f1 and f2 are both strings which are the names of the features
        //This function is called in the simulation tool initially
        //This function only does the point intersection of features 

        function intersect_feature(f1, f2) {
            console.log(f1, f2)
            //Need access to the feature type
            //Need access to feature coordinates
            //Note that 
            type_1 = Feature_coords[f1][1]
            type_2 = Feature_coords[f2][1]
            geom_1 = Feature_coords[f1][0] // doing the intersection LRT
            geom_2 = Feature_coords[f2][0] // being intersecting

            var geom_intersection = intersecter(geom_1, geom_2, type_1, type_2)
            intersect_length = geom_intersection.features.length
            locater = []; // has the number of intersections 
            for (var i = 0; i < intersect_length; ++i) {
                var feature = geom_intersection.features[i].geometry.coordinates
                locater.push(feature)
            }
            inter_points = createGeometry(locater, 'multipoint')
            console.log(inter_points)
            symbol = symbology('point')
            console.log(symbol)
			
			//var tester = createGeometry(geom_1, 'polyline')
			//var sym = symbology('polyline')
			//uiAddGraphics(tester,sym)
            uiAddGraphics(inter_points, symbol)
            //buffer_feature(100)

        }

        /////////////////////This addEventListener controls all maneuvorabiltiy//////////////////////////////////////////////////
        //This section handles any onclick functionality
        //Probably rewrite the checkbox code to be smarter

        var feature_show = [null, null] // The features for functionality
        document.addEventListener('click', function (event) {
            var element = event.target
            //The track element here 
            if (element.innerHTML.includes("Intersection ")) {
                id_num = parseInt(element.id) //This is the value of the intersection

                //add the track here

                if ((id_num - 1 >= 0) && (id_num < locater.length)) { //just trying to get the different id points from points 0 to 1
                   
                    //alert('track route not last or first')
                    track_route = point_along_line(locater[id_num - 1], locater[id_num]) //Function from the turf.js
                } else {
                    track_route = point_along_line(locater[id_num], locater[id_num])
                    //Note track route is the coordinates of points leading to it plus
                    //the length
                }
                //console.log(track_route)
                stubGeolocation(track_route[0]);
                view.center = element.value //[id_num]
                view.zoom = 19
                tracker(view)

            }
            var save_event = [element.id]
            if (Feature_name.includes(save_event[0])) {
                if (feature_show[0] == null) {
                    feature_show[0] = save_event[0]
                    //alert(feature_show)
                } else if (feature_show[1] == null) {
                    feature_show[1] = save_event[0]
                    //alert(feature_show)
                }
            }
            if (feature_show[0] == feature_show[1]) {
                feature_show[1] = save_event[0]
            }
            if (feature_show.includes('Simulate')) {
                var index = feature_show.find('Simulate')
                feature_show[index] = save_event[0]
            }
			
			if (feature_show.includes('outer_area')) {
                var index = feature_show.find('outer_area')
                feature_show[index] = save_event[0]
            }
            if (element.id == "Simulate") { //Note need to write one for the features itself
                //alert(feature_show)
                if (feature_show[0] != feature_show[1]) {
                    run_Simulation()
                }

            }
        });


        function tracker(view) { // the view of the map in our Municipal.js
            var icon =
                "M29.395,0H17.636c-3.117,0-5.643,3.467-5.643,6.584v34.804c0,3.116,2.526,5.644,5.643,5.644h11.759c3.116,0,5.644-2.527,5.644-5.644V6.584C35.037,3.467,32.511,0,29.395,0zM34.05,14.188v11.665l-2.729,0.351v-4.806L34.05,14.188zM32.618,10.773c-1.016,3.9-2.219,8.51-2.219,8.51H16.631l-2.222-8.51C14.41,10.773,23.293,7.755,32.618,10.773zM15.741,21.713 v4.492l-2.73-0.349V14.502L15.741,21.713z M13.011,37.938V27.579l2.73,0.343v8.196L13.011,37.938zM14.568,40.882l2.218-3.336 h13.771l2.219,3.336H14.568z M31.321,35.805v-7.872l2.729-0.355v10.048L31.321,35.805";
            var car_colour = "#427af4"
            var car = new SimpleMarkerSymbol();
            car.color = car_colour
            car.path = icon
            car.size = "23px"
            var track = new Track({
                view: view,
                goToLocationEnabled: false, // disable this since we want to control what happens after our location is acquired
                graphic: new Graphic({
                    symbol: car // Overwrites the default symbol used for the
                    // graphic placed at the location of the user when found
                })
            }); //has a pause for it if a vehicle 
            view.ui.add(track, "top-left");


            view.when(function () {
                var prevLocation = view.center;

                track.on("track", function () {
                    var location = track.graphic.geometry;

                    view.goTo({
                        center: location,
                        tilt: 50,
                        scale: 2500,
                        heading: 360 - getHeading(location, prevLocation), // only applies to SceneView
                        rotation: 360 - getHeading(location, prevLocation) // only applies to MapView
                    });

                    prevLocation = location.clone();
                });
                track.start();
            });
        }

        function getHeading(point, oldPoint) {
            // get angle between two points
			//(Math.atan2(point.y - oldPoint.y, point.x - oldPoint.x) * 180) /Math.PI;
            var angleInDegrees =
                (Math.atan2(point.y - oldPoint.y, point.x - oldPoint.x) * 180)/Math.PI
            // move heading north
            return -180 + angleInDegrees;
        } // This is just to change angle of the map


        // geolocation simulator
        function stubGeolocation(coords) { //adjusts the locator direction
			
			var valuer1 = document.body.contains(gauge_container);
			var valuer2 = document.body.contains(cars_present);
			if (valuer1 != true){
				gauge() // Creates the gauge
			}
			if (valuer2 != true){
				car_intersection() //Creates the cars at Intersection
			}
            
            var add_path = createGeometry([locater[id_num - 1], locater[id_num]], 'polyline')
            var symbol = symbology('polyline')
            uiAddGraphics(add_path, symbol)
            coords,

            currentCoordIndex = 0;

            geolocate.use();

            const meme = setInterval(function () {
                geolocate.change(coords[currentCoordIndex]);
                change_layer(currentCoordIndex * 5, track_route[1])
                //console.log((track_route[1] - (currentCoordIndex * 5)) / 1000) //km
                currentCoordIndex = (currentCoordIndex + 1) //% coords.length; // the modulo is to make it reloop
                console.log(coords.length)
                console.log(currentCoordIndex)
                if (coords.length == currentCoordIndex) {
                    clearInterval(meme)
                }
                var currdistance = track_route[1] - (currentCoordIndex * 5)
                if (currdistance < 30) {
                    symbol.color = [0, 255, 0, 0.3]
                    uiAddGraphics(add_path, symbol)
                    car_change_layer()
                }

            }, 300); //adjusting here changes the speed of the geolocator 
        }


        /////////////////////////////////Run Simulation Button/////////////////////////////////////////

        ////////////////////////////////Remove Element//////////////////////////////////////
        //The function elementId removes the id of an unwanted element
        //The function consumes the string which is an element id and removes it
        function removeElement(elementId) {
            // Removes an element from the document
            var element = document.getElementById(elementId);
            element.parentNode.removeChild(element);
        }

        //The function run_Simulation runs the intersection similation

        ////////////////////////////////Remove Element//////////////////////////////////////
        function run_Simulation() {
            intersect_feature(feature_show[0], feature_show[1])
            removeElement('Simulate')
            removeElement("checklister") //removes the div which stores the feature for the checkboxes
            c_Intersection(locater)
            feature_show = [null, null]
            console.log(feature_show)
        }



        //////////////////////////////////////////////////////////////////////////
        //The function createCheckboxes takes in no parameters and create the different
        //available features that are available.
        //please note that this functionality appears after the local storage element
        function createFeatures2() {
            //Feature_name = ["leggg1", "leggg2", "legg3"]
            var feature_box;
            var outer_area = document.getElementById('outer_area')

            feature_box = document.createElement("div");
            feature_box.classList.add("fDiv");
            feature_box.classList.add("fDivText");
            feature_box.id = "checklister"

            for (var i = 0; i < Feature_name.length; ++i) {


                // creating checkbox element 
                var checkbox = document.createElement('input');

                checkbox.setAttribute("type", "checkbox");
                var spanner = document.createElement('span');
                spanner.classList.add('checkmark')




                // creating label for checkbox 
                var label = document.createElement('label');
                label.id = Feature_name[i];
                spanner.id = Feature_name[i];
                checkbox.id = Feature_name[i];

                // assigning attributes for  
                // the created label tag  
                //label.htmlFor = Feature_name[i];

                // appending the created text to  
                // the created label tag  
                //label.appendChild(document.createTextNode(Feature_name[i]));
                label.innerHTML = Feature_name[i]
                // appending the checkbox 
                // and label to div 
                label.appendChild(checkbox);
                label.appendChild(spanner)
                label.classList.add('container')
                //document.body.appendChild(label);
                //feature_box.appendChild(checkbox);
                feature_box.appendChild(label);
                outer_area.appendChild(feature_box)
                document.body.appendChild(outer_area);

            }
        }
        createFeatures2()


        ///////////////////////////////The intersection Elements//////////////////////////////////////
        //The fucntion C_Intersection creates the different intersection divs that
        //resulted from the feature intersections
        //it comes the global variable locater
        function c_Intersection(locater) {
            lengther = locater.length
            var i = 0
            var element;

            var outer_area = document.getElementById('outer_area')
            var map_dimensions = document.getElementById('viewDiv')

            outer_area.classList.add('center_item_enlarge') //CHanging the outer area dimensions
            map_dimensions.classList.add('viewDiv_change') //Changing the map dimensions

            var c_Outerdiv = document.createElement('div') //This is the div for saving intersections
            c_Outerdiv.classList.add('outer_cDiv')
            //First step is to take the intersection areas of the data
            while (i < lengther) {
                element = document.createElement("div");
                element.value = [i, convert_projection(locater[i][0], locater[i][1])] //adds the location value to
                element.id = i;
                element.innerHTML = "Intersection " + String(i + 1);
                element.classList.add("cDiv");
                element.classList.add("cDivText");

                c_Outerdiv.appendChild(element)
                outer_area.appendChild(c_Outerdiv)

                document.body.appendChild(outer_area);
                ++i;
            }
            i = 0
        }
        /////////////////////////////////////////////////////////////////////

        ///////////////////////Create the side panel/////////////////////////////////
		var gauge_container;
        function gauge() {
            var outer_area = document.getElementById('outer_area');

            gauge_container = document.createElement('div')
            gauge_container.classList.add("containergauge")

            var value_gauge = document.createElement('h1')
            value_gauge.classList.add("loader__title")
            value_gauge.innerHTML = "0" //initial starter for the gauge
            value_gauge.innerText = "0" //initial starter for the gauge



            var loader = document.createElement('div')
            loader.classList.add('loader')

            gauge_container.appendChild(value_gauge)
            gauge_container.appendChild(loader)
            outer_area.appendChild(gauge_container)
            document.body.appendChild(outer_area)
        }
		
		var cars_present;
        function car_intersection() {
            var outer_area = document.getElementById('outer_area');
            cars_present = document.createElement('div')
            cars_present.id = "car_number"
            cars_present.classList.add('car_panel')

            var car_numbershead = document.createElement("h1")
            car_numbershead.classList.add("car_h1")
            car_numbershead.innerHTML = "Cars at Intersection"
            var car_numbers = document.createElement("h2")
            car_numbers.classList.add("car_h2")

            cars_present.appendChild(car_numbershead)
            cars_present.appendChild(car_numbers)
            outer_area.appendChild(cars_present);
            document.body.appendChild(outer_area)
        }
    });
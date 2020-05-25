require([
        "geolocate",
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
        "/Javascript/turf_functions.js"

        //"/Javascript/geolocate_track.js"
        //,
        //"/Javascript/test.js" //call another js file into my program
    ],
    function (geolocate, Track, Map, MapView, /* SceneView,*/ Layer, FeatureLayer, Graphic, geometryEngine, Polyline, Polygon, Multipoint, Point,
        ScaleBar, SimpleMarkerSymbol) {
        var map = new Map({
            basemap: "dark-gray-vector",
            showAttribution: false
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
        //view.ui.add(simulate, "bottom-right")


        var scaleBar = new ScaleBar({
            view: view
        });
        // Add widget to the bottom left corner of the view
        view.ui.add(scaleBar, {
            position: "bottom-left"
        });



        //November 16th Here i actually got the geometry
        //////////////////////////////////////////////////////////////////////////

        var Feature_name; //Names of the features being used 
        var Feature_list; // The dictionary of the geometries
        var Feature_coords; // Stores the coordinates of all the geometries for ease of access
        var locater; // stores coordinates of the intersection
        var inter_points; // stores as a multipoint all the points created for an intersection
        var buffered_features = []; // the buffered features



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

            var lineSymbol = {
                type: "simple-line", // autocasts as new SimpleLineSymbol()
                color: [255, 0, 0], // RGB color values as an array
                width: 4
            };
            var lineSymbol2 = {
                type: "simple-line", // autocasts as new SimpleLineSymbol()
                color: [0, 0, 255], // RGB color values as an array
                width: 1
            };

            var polylineGraphic = new Graphic({
                geometry: Feature_list['ION_Routes'], // Add the geometry created in step 4
                symbol: lineSymbol //, // Add the symbol created in step 5
                //attributes: lineAtt // Add the attributes created in step 6
            });
            var polylineGraphic2 = new Graphic({
                geometry: Feature_list['Railways'], // Add the geometry created in step 4
                symbol: lineSymbol2 //, // Add the symbol created in step 5
                //attributes: lineAtt // Add the attributes created in step 6
            });
            //view.graphics.add(polylineGraphic);
            //view.graphics.add(polylineGraphic2);

        }
        local_receiver()

        //////////////////////////////////////////////////////////////////////////
        //Does the intersection 
        //f1 and f2 are both strings which are the names of the features
        //need a function to call it 

        var locater;

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

            var markerSymbol = {
                type: "simple-marker", // autocasts as new SimpleMarkerSymbol()
                color: [255, 0, 0],
                outline: {
                    // autocasts as new SimpleLineSymbol()
                    color: [255, 255, 255],
                    width: 1
                }
            };
            var polylineGraphic3 = new Graphic({
                geometry: inter_points, // Add the geometry created in step 4
                symbol: markerSymbol //, // Add the symbol created in step 5
                //attributes: lineAtt // Add the attributes created in step 6
            });

            view.graphics.add(polylineGraphic3);


            //buffer_feature(100)
            c_Intersection(locater)

        }

        intersect_feature('ION_Routes', 'road_network_classes_gio')

        function buffer_feature(range) {
            //Lets use locator as the reason of consideration

            var length = locater.length
            var polySym = {
                type: "simple-fill", // autocasts as new SimpleFillSymbol()
                color: [140, 140, 222, 0.5],
                outline: {
                    color: [0, 0, 0, 0.5],
                    width: 2
                }
            };
            for (var i = 0; i < length; ++i) {
                //console.log(locater[i])
                var geometry = createGeometry(locater[i], 'point')
                var buffer_results = geometryEngine.buffer(geometry, range, 'meters')

                var polylineGraphic4 = new Graphic({
                    geometry: buffer_results, // Add the geometry created in step 4
                    symbol: polySym //, // Add the symbol created in step 5
                    //attributes: lineAtt // Add the attributes created in step 6
                });
                buffered_features.push([geometry, buffer_results])
                view.graphics.add(polylineGraphic4);
                console.log(view.graphics)
            }


            return buffered_features
            //contains(containerGeometry, insideGeometry)
            //distance(geometry1, geometry2, distanceUnit)
            //Just to see if specific geometry falls within the buffer region
            //nearestCoordinate(geometry, inputPoint) may need these for moving car to the point
            //nearestVertex(geometry, inputPoint)
        }


        function uiAddGraphics() {
            //connects with symbology when onclick of the created feature element
            //next step is then add the graphics to the map
        }





        /////////////////////////////////////////////////////////////////////////
        //Creating ELements here I am able to add to the body
        //Possible allow user to use different class information
        //Now lets highlight the specific intersection
        //sample
        var intersection_grid = [] // A grid of all the intersections which took place

        //////////////////////////////////////////////////////////////////////////
        //Just to create the useable features for the analysis
        function createFeatures() {

            var feature_box;
            for (var i = 0; i < Feature_name.length; ++i) {
                feature_box = document.createElement("div");

                feature_box.classList.add("fDiv");
                feature_box.classList.add("fDivText");

                // creating checkbox element 
                var checkbox = document.createElement('input');

                // Assigning the attributes 
                // to created checkbox 
                checkbox.type = "checkbox";
                checkbox.name = Feature_name[i];
                checkbox.value = Feature_name[i];
                checkbox.id = "Feature" + String(i);

                // creating label for checkbox 
                var label = document.createElement('label');

                // assigning attributes for  
                // the created label tag  
                label.htmlFor = Feature_name[i];

                // appending the created text to  
                // the created label tag  
                label.appendChild(document.createTextNode(Feature_name[i]));

                // appending the checkbox 
                // and label to div 
                feature_box.appendChild(checkbox);
                feature_box.appendChild(label);
                document.body.appendChild(feature_box);

            }
        }
        createFeatures()


        //////////////////////////////////////////////////////////////////////////

        function c_Intersection(locater) {
            lengther = locater.length
            var i = 0
            var element;

            //First step is to take the intersection areas of the data
            while (i < lengther) {
                element = document.createElement("div");
                element.value = [i, convert_projection(locater[i][0], locater[i][1])] //adds the location value to
                element.id = i;
                element.innerHTML = "Intersection " + String(i + 1);
                element.classList.add("cDiv");
                element.classList.add("cDivText");
                document.body.appendChild(element);

                //element.classList.remove("mystyle");
                ++i;
                //console.log(element.value)
            }
            i = 0
        }



        ////////////////////////////////////////////////////////////////////////
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
                var prevLocation2 = view.center;

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
            var angleInDegrees =
                (Math.atan2(point.y - oldPoint.y, point.x - oldPoint.x) * 180) /
                Math.PI;

            // move heading north
            return -180 + angleInDegrees;
        } // This is just to change angle of the map


        // geolocation simulator
        function stubGeolocation(coords) { //adjusts the locator direction
            alert('here')
            coords,

            currentCoordIndex = 0;

            geolocate.use();

            setInterval(function () {
                geolocate.change(coords[currentCoordIndex]);
                currentCoordIndex = (currentCoordIndex + 1) % coords.length;
            }, 400); //adjusting here changes the speed of the geolocator 
        }

        var feature_show = [null, null]
        document.addEventListener('click', function (event) {
            var element = event.target
            alert(element.value)
            //The track element here 
            if (element.innerHTML.includes("Intersection ")) {
                id_num = parseInt(element.id) //This is the value of the intersection

                //add the track here
                var track_route
                if ((id_num - 1 >= 0) && (id_num < locater.length)) { //just trying to get the different id points from points 0 to 1
                    alert('not same')
                    track_route = point_along_line(locater[id_num - 1], locater[id_num]) //Function from the turf.js
                } else {
                    alert('same')
                    track_route = point_along_line(locater[id_num], locater[id_num])
                }
                console.log(track_route)
                stubGeolocation(track_route);
                tracker(view)
                view.center = element.value //[id_num]
                view.zoom = 18
            }
            if (element.innerHTML.includes("Feature")) {


            }
        }, true);

        //alert(randomWholeNum())

        ////////////////////////////////////////////////////////////////////////

























        /////////////////////////////////////////////////////////////////////////////
        //This Section is for changing to different areas
        //Remove Esri Map Credits 
        //Get a smoother transition 
        //Done this section November 1, 2019 
        function fix_location() {

        }
        /////////////////////////////////////////////////////////////////////////////
        var i = 0 // for running this function
        function location_base() { //This is to change to the different locations
            if (locater == []) {
                return 'Error'
            }
            lengther = locater.length

            if (i < lengther) {
                //console.log(locater)
                console.log(i)
                pt = convert_projection(locater[i][0], locater[i][1])
                //console.log(pt)
                view.center = pt
                view.zoom = 17
                setTimeout(location_base, 5000);
            }
            ++i;
        }
        document.getElementById('test').addEventListener('click', location_base); //Just to run the function
        //to see the different change elements if want to visualize every area


    });
//Making this work with my file 
/*var dojoConfig = {
    packages: [{
        name: "geolocate",
        location: "//2gis.github.io/mock-geolocation/dist",
        main: "geolocate"
    }]
};*/

require([
        "/Javascript/geolocate.js",
        //"geolocate", // geolocation simulator (https://github.com/2gis/mock-geolocation)
        "esri/widgets/Track",
        "esri/views/MapView",
        "esri/views/SceneView",
        "esri/Map",
        "esri/symbols/SimpleMarkerSymbol",
        "esri/symbols/PictureMarkerSymbol",
        "esri/Graphic", //,
        "esri/geometry/Polyline",
        "/Javascript/turf_functions.js"
    ],
    function (Track, MapView, SceneView, Map, SimpleMarkerSymbol, PictureMarkerSymbol, Graphic,
        Polyline) {

        console.log(geolocate)


        var track_route = point_along_line() //Function from the turf.js
        console.log(track_route)
        // geolocation simulator
        stubGeolocation(track_route);

        /*var map = new Map({
            basemap: "dark-gray-vector"
        });

        var view = new MapView({
            map: map,
            container: "viewDiv",
            center: [-80.510492, 43.482556], //[-117.187038, 34.057322],
            zoom: 18,
            ui: {
                components: ["attribution"] // replace default set of UI components
            }
        });*/




        var icon =
            "M29.395,0H17.636c-3.117,0-5.643,3.467-5.643,6.584v34.804c0,3.116,2.526,5.644,5.643,5.644h11.759c3.116,0,5.644-2.527,5.644-5.644V6.584C35.037,3.467,32.511,0,29.395,0zM34.05,14.188v11.665l-2.729,0.351v-4.806L34.05,14.188zM32.618,10.773c-1.016,3.9-2.219,8.51-2.219,8.51H16.631l-2.222-8.51C14.41,10.773,23.293,7.755,32.618,10.773zM15.741,21.713 v4.492l-2.73-0.349V14.502L15.741,21.713z M13.011,37.938V27.579l2.73,0.343v8.196L13.011,37.938zM14.568,40.882l2.218-3.336 h13.771l2.219,3.336H14.568z M31.321,35.805v-7.872l2.729-0.355v10.048L31.321,35.805";
        var car_colour = "#427af4"
        var car = new SimpleMarkerSymbol();
        car.color = car_colour
        car.path = icon
        car.size = "23px"

        /*
        var picture = new PictureMarkerSymbol("/Pics/car_2.png")
        picture.width = "20px"
        picture.height = "20px"*/


        function tracker(view) { // the view of the map in our Municipal.js
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
            return -90 + angleInDegrees;
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
            }, 450); //adjusting here changes the speed of the geolocator 
        }
    });
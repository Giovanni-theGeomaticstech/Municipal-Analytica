var map;

require([
        "esri/config",
        "esri/InfoTemplate",
        "esri/map",
        "esri/request",
        "esri/geometry/scaleUtils",
        "esri/layers/FeatureLayer",
        "esri/renderers/SimpleRenderer",
        "esri/symbols/PictureMarkerSymbol",
        "esri/symbols/SimpleFillSymbol",
        "esri/symbols/SimpleLineSymbol",
        "dojo/dom",
        "dojo/json",
        "dojo/on",
        "dojo/parser",
        "dojo/sniff",
        "dojo/_base/array",
        "esri/Color",
        "dojo/_base/lang",
        "esri/geometry/geometryEngine",
        "esri/geometry/Polygon",
        "esri/geometry/Polyline",
        "esri/geometry/Point",
        "esri/geometry/Multipoint",
        "esri/graphic",
        "dijit/layout/BorderContainer",
        "dijit/layout/ContentPane",
        "dojo/domReady!"
    ],
    function (
        esriConfig, InfoTemplate, Map, request, scaleUtils, FeatureLayer,
        SimpleRenderer, PictureMarkerSymbol, SimpleFillSymbol, SimpleLineSymbol,
        dom, JSON, on, parser, sniff, arrayUtils, Color, lang, geometryEngine, Polygon, Polyline,
        Point, Multipoint, Graphic
    ) {

        parser.parse();

        var portalUrl = "https://www.arcgis.com";

        esriConfig.defaults.io.proxyUrl = "/proxy/";


        var featureName = []; // Names of the features added
        var featureList = {}; //List of the added Layers with name

        on(dom.byId("file_upload"), "change", function (event) {
            fileName =
                'C:\\Users\\gioha\\Documents\\Fall_term_2019\\Geog_481\\Project\\Datasets\\GEOG_481\\Region_of_Waterloo_Open_Data\\ION_Routes.zip'
            fileName.toLowerCase();
            //var fileName = event.target.value.toLowerCase();

            if (sniff("ie")) { //filename is full path in IE so extract the file name
                var arr = fileName.split("\\");
                fileName = arr[arr.length - 1];
            }
            if (fileName.indexOf(".zip") !== -1) { //is file a zip - if not notify user
                generateFeatureCollection(fileName);
            } else {
                dom.byId('file_upload').innerHTML = '<p style="color:red">Add shapefile as .zip file</p>';
                //dom.byId('upload-status').innerHTML = '<p style="color:red">Add shapefile as .zip file</p>';
            }
        });

        map = new Map("mapCanvas", {
            basemap: "dark-gray-vector",
            center: [-80.5204, 43.4643],
            spatialReference: {
                wkid: 4326
            },
            zoom: 3,
            slider: false
        });



        function generateFeatureCollection(fileName) {

            var name = fileName.split("."); //Splits it into 'zip' and name
            //Chrome and IE add c:\fakepath to the value - we need to remove it
            //See this link for more info: http://davidwalsh.name/fakepath

            console.log(name)
            name = name[0].replace("c:\\fakepath\\", "");
            /*function myFunction() { for cross browser support
            var element, name, arr;
            element = document.getElementById("myDIV");
            name = "mystyle";
            arr = element.className.split(" ");
            if (arr.indexOf(name) == -1) {
                element.className += " " + name;
            }
            }*/
            dom.byId('upload-status').classList.add("visibility_show")
            //dom.byId('upload-status').innerHTML = '<b>Loading… </b>' + name;

            //Define the input params for generate see the rest doc for details
            //http://www.arcgis.com/apidocs/rest/index.html?generate.html
            var params = {
                'name': name,
                'targetSR': map.spatialReference,
                'maxRecordCount': 4000,
                'enforceInputFileSizeLimit': true,
                'enforceOutputJsonSizeLimit': true
            };

            //generalize features for display Here we generalize at 1:40,000 which is approx 10 meters
            //This should work well when using web mercator.
            var extent = scaleUtils.getExtentForScale(map, 40000);
            var resolution = extent.getWidth() / map.width;
            params.generalize = true;
            params.maxAllowableOffset = resolution;
            params.reducePrecision = true;
            params.numberOfDigitsAfterDecimal = 0;

            var myContent = {
                'filetype': 'shapefile',
                'publishParameters': JSON.stringify(params),
                'f': 'json',
                'callback.html': 'textarea'
            };

            //use the rest generate operation to generate a feature collection from the zipped shapefile
            request({
                url: portalUrl + '/sharing/rest/content/features/generate',
                content: myContent,
                form: dom.byId('file_upload'),
                handleAs: 'json',

                load: lang.hitch(this, function (response) {

                    if (response.error) {
                        errorHandler(response.error);
                        return;
                    }
                    var layerName = response.featureCollection.layers[0].layerDefinition.name;
                    dom.byId('upload-status').classList.remove("visibility_show")
                    //innerHTML = '<b>Loaded: </b>' + layerName;
                    addShapefileToMap(response.featureCollection);
                }),
                error: lang.hitch(this, errorHandler)
            });
        }



        function errorHandler(error) {
            dom.byId('upload-status').classList.remove("visibility_show")
            alert(error.message)
        }




        var original_path = [];

        function build_data(base, layer_name) {
            //featureName #The list of values of the names of the layers added

            type_list = ["esriGeometryPolyline", "esriGeometryPoint", "esriGeometryPolygon"]
            featureName.push(layer_name)

            var bbc;
            featureList[layer_name] = []
            if (base.geometryType == type_list[0]) {
                //Initial just grabbing each path no editing 
                for (i = 0; i < base.features.length; ++i) {
                    featureList[layer_name].push(base.features[i].geometry.paths)
                }

                length = base.features.length
                //Fixing Paths so that it can become a geometry
                for (var i = 0; i < length; ++i) {
                    original_path.push(featureList[layer_name][i][0])
                }
                //console.log(bbc)
                featureList[layer_name] = [original_path, 'polyline']
                original_path = [];
            }
            //Making Geometry for the feature listing dictionary 
            else if (base.geometryType == type_list[1]) {

                for (i = 0; i < base.features.length; ++i) {
                    var temp = base.features[i].geometry
                    featureList[layer_name].push([temp.x, temp.y])
                }
                mp = {
                    points: featureList[layer_name]
                }
                featureList[layer_name] = new Multipoint(mp)
                console.log(featureList[layer_name])
            } else {
                for (i = 0; i < base.features.length; ++i) {
                    featureList[layer_name].push(base.features[i].geometry.rings)
                }
                featureList[layer_name] = new Polygon(featureList[layer_name][0])
                console.log(featureList)
            }

            local_storage(featureName, featureList)
        }

        function local_storage(featureName, featureList) {
            localStorage.setItem('Feature_name', JSON.stringify(featureName));
            localStorage.setItem('Features', JSON.stringify(featureList));
        }

        var prev_layer;

        function addShapefileToMap(featureCollection) {
            //add the shapefile to the map and zoom to the feature collection extent
            //If you want to persist the feature collection when you reload browser you could store the collection in
            //local storage by serializing the layer using featureLayer.toJson()  see the 'Feature Collection in Local Storage' sample
            //for an example of how to work with local storage.
            var fullExtent;
            var layers = [];

            base = featureCollection.layers[0].featureSet
            console.log(featureCollection.layers[0])
            layer_name = featureCollection.layers[0].layerDefinition.name //Names of the features added
            build_data(base, layer_name)

            //////////////////////////////////////////////////////////////////////

            //This is just the styling for pop up information on the feature layer
            arrayUtils.forEach(featureCollection.layers, function (layer) {
                var infoTemplate = new InfoTemplate("Details", "${*}");
                var featureLayer = new FeatureLayer(layer, {
                    infoTemplate: infoTemplate
                });

                //associate the feature with the popup on click to enable highlight and zoom to
                featureLayer.on('click', function (event) {
                    map.infoWindow.setFeatures([event.graphic]);
                });
                //////////////////////////////////////////////////////////////////////

                //change default symbol if desired. Comment this out and the layer will draw with the default symbology
                changeRenderer(featureLayer);
                fullExtent = fullExtent ?
                    fullExtent.union(featureLayer.fullExtent) : featureLayer.fullExtent;
                layers.push(featureLayer);
            });
            prev_layer = layers
            map.addLayers(layers);
            map.setExtent(fullExtent.expand(1.25), true);
        }





        function changeRenderer(layer) {
            //change the default symbol for the feature collection for polygons and points
            var symbol = null;
            switch (layer.geometryType) {
                case 'esriGeometryPoint':
                    symbol = new PictureMarkerSymbol({
                        'angle': 0,
                        'xoffset': 0,
                        'yoffset': 0,
                        'type': 'esriPMS',
                        'url': 'https://static.arcgis.com/images/Symbols/Shapes/BluePin1LargeB.png',
                        'contentType': 'image/png',
                        'width': 20,
                        'height': 20
                    });
                    break;
                case 'esriGeometryPolygon':
                    symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                        new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                            new Color([112, 112, 112]), 1), new Color([136, 136, 136, 0.25]));
                    break;
            }
            if (symbol) {
                layer.setRenderer(new SimpleRenderer(symbol));
            }
            layerIds = map.graphicsLayerIds
            if (layerIds.length >= 1) {
                remove = map.getLayer(layerIds[0])
                map.removeLayer(remove)
            }
        }

    });
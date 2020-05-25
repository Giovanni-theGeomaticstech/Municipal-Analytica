/////////////////////////////////////////////////////////////////////
//Note that type is a list of the feature type
//geom_1 will be the first feature and geom 2 will correspond to the second feature
function intersecter(geom_1, geom_2, type_1, type_2) {


    var Feature_name = JSON.parse(localStorage.getItem('Feature_name'));
    var Feature_list = JSON.parse(localStorage.getItem('Features'));
    //Create Divs for each of the added features

    if (type_1 == 'polyline') {
        geom_1 = turf.multiLineString(geom_1);
    } else if (type_1 == 'polygon') {
        geom_2 = turf.polygon(geom_1)
    } else {
        return "Your first feature is messed up"
    }

    if (type_2 == 'polyline') {
        geom_2 = turf.multiLineString(geom_2);
    } else if (type_2 == 'polygon') {
        geom_2 = turf.polygon(geom_2)
    } else {
        return "Your second feature is messed up"
    }

    var intersect = turf.lineIntersect(geom_1, geom_2);
    return intersect
}

/////////////////////////////////////////////////////////////////////

function buffer(geometry, range) {
    var point = turf.point([-90.548630, 14.616599]);
    var buffered = turf.buffer(point, 10, {
        units: 'meters'
    })
    return buffered
}

function convert_projection(x, y) {
    var pt = turf.point([x, y]);
    var converted = turf.toWgs84(pt);
    temp = converted.geometry.coordinates
    return [temp[0], temp[1]]
}

function distance_points(c1, c2) {
    c1 = convert_projection(c1[0], c1[1])
    c2 = convert_projection(c2[0], c2[1])
    var line = turf.lineString([
        c1,
        c2,
    ]);
    var length = turf.length(line, {
        units: 'meters'
    });
    console.log(length)
}

function point_along_line(c1, c2) { //Creating route for the vehicle
    //c1 = [-80.524672, 43.462884] // the two points used to create my line segment
    //c2 = [-80.522291, 43.460828]
    console.log(c1, c2)
    c1 = convert_projection(c1[0], c1[1])
    c2 = convert_projection(c2[0], c2[1])
    console.log(c1, c2)
    var line = turf.lineString([
        c1,
        c2,
    ]);
    var length = turf.length(line, {
        units: 'meters'
    });
    console.log(length)
    var options = {
        units: 'meters'
    };

    var temp_length = length // the actual line segment length
    //var along = turf.along(line, 10, options);
    //console.log(along)

    var current_location = 5
    var track = []

    var track_template = {
        lat: null,
        lng: null
    }
    while (length >= 5) { //5 meter intervals
        if (c1 == c2) {
            break
        } else {
            var along = turf.along(line, current_location, options);
            //console.log(along.geometry.coordinates)
            length = length - 5
            current_location += 5
            var track_template = {
                lat: null,
                lng: null
            }
            track_template.lat = along.geometry.coordinates[1] //latitude
            track_template.lng = along.geometry.coordinates[0] //longitude
            track.push(track_template)
        }
    }
    //Just to get the last set of coordinates 
    track_template.lat = c2[1] //latitude
    track_template.lng = c2[0] //longitude 
    track.push(track_template)
    //console.log(track)
    return [track, temp_length]
}

//point_along_line()
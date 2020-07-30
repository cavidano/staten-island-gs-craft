//////////////////////////////////////////////
// A. Global Variables
//////////////////////////////////////////////

const mapTarget = document.getElementById("map-view");

let sidebarShown = false;

//////////////////////////////////////////////
// B. Map Height
//////////////////////////////////////////////

function setMapHeight() {
    const windowHeight = window.innerHeight;
    const mapTargetPos = mapTarget.offsetTop;
    const adjustedHeight = windowHeight - mapTargetPos + "px";
    
    mapTarget.style.height = adjustedHeight;
}

setMapHeight();

//////////////////////////////////////////////
// B. Create Leaflet Map
//////////////////////////////////////////////

var map = L.map('map-loader', {
    center: [40.5795, -74.1502],
    setZoom: 14,
    minZoom: 8,
    maxZoom: 16,
    scrollWheelZoom: false,
    attributionControl: false,
    zoomControl: false,
});

var myPath = ".";

// Create custom pin

var Icon = L.Icon.extend({
    options: {
        iconSize: [30, 45],
        iconAnchor: [15, 45],
        shadowSize: [45, 22.5],
        shadowAnchor: [22.5, 22.5],
        shadowUrl: myPath + './images/map-pin-shadow.svg',
        popupAnchor:  [0, -50]
    }
});

// Load SI Bounds

var siGeo = new L.GeoJSON.AJAX('./lib/geojson/statenIsland.geojson');

siGeo.on('data:loaded', function() {
    centerMap(siGeo);
    L.tileLayer.provider('CartoDB.VoyagerNoLabels').addTo(map);
});

function centerMap(myBounds){
    map.fitBounds(myBounds.getBounds(), { padding: [20, 20] });
}

// Custom popup options

var markerOptions = {
    riseOnHover: true,
    icon: Icon
};

var openMeeting = new Icon( { iconUrl: myPath + '/images/map-pin-open.svg'} );
var closedMeeting = new Icon( { iconUrl: myPath + '/images/map-pin-closed.svg'} );

// Create Markers

markerLayer = L.layerGroup([]).addTo(map);

function createMarker(
    meetingType,
    meetingTitle,
    streetAddress,
    zipCode
) {

    var meeting;

    var geoLat, geoLng, coords, marker;

    if( meetingType === closedMeeting ){
        meeting = 'Closed';
    } else if ( meetingType === openMeeting ) {
        meeting = 'Open';
    }

    var cityState = "Staten Island, NY";

    var locationAddress = streetAddress + " " + cityState + " " + zipCode;
    console.log(locationAddress);
    
    L.esri.Geocoding.geocode().address(locationAddress).run( function (err, results) {

        if (err) {
            return;
        } else {

            var AddressGeoResults = Object.values(results);

            geoLat = AddressGeoResults[0][0].latlng.lat;
            geoLng = AddressGeoResults[0][0].latlng.lng;

            coords = [geoLat, geoLng];
        }
        
        marker = L.marker(coords, { icon: meetingType }).addTo(markerLayer);

        var contentPopUp = '<a href="#1" class="text-primary"><strong>' + meetingTitle + '</strong></a>' + 
                           '<p class="meeting__address">' + streetAddress + '<br>' + cityState + ' ' + zipCode + '</p>'

        var contentSidebar = '<p class="meeting__title">' + meetingTitle + '</p>' +
                             '<p class="meeting__type">' + meeting + ' Discussion' + '</p>' +
                             '<p class="meeting__address">' + streetAddress + '<br>' + cityState +' ' + zipCode + '</p>';
        
        marker.bindPopup(contentPopUp);

        // Desktop Marker Functionality

        var mediaQuery = window.matchMedia('( max-width: 1000px )');

        function watchMediaQuery(event) {

            if (event.matches) {
                return;
            } else {

                marker.on('click', function (event) {

                    if (sidebarShown === false) {
                        mapTarget.classList.add('data-shown');
                        sidebarShown = true;
                        map.invalidateSize(true);
                    }

                    var id = L.Util.stamp(event.target);

                    if (document.getElementById(id) != null) return;

                    var dataLoader = L.DomUtil.create('div', 'dataLoader', document.getElementById('data-loader'));

                    dataLoader.id = id;
                    
                    var meetingDetail = L.DomUtil.create('div', 'meeting-detail' + ' ' + meeting.toLowerCase() + ' ' + 'border-bottom', dataLoader);
                    meetingDetail.innerHTML = contentSidebar;
                    
                    meetingDetail.setAttribute("tabindex", 0);

                    meetingDetail.setAttribute("data-highlight", "true");

                    setTimeout( function() {
                        meetingDetail.setAttribute("data-highlight", "false");
                    }, 2000)
                    
                    L.DomEvent.on( meetingDetail, 'click', function (event) {

                        if( event.target.classList.contains('btn')) {
                            event.preventDefault();
                        } else {
                            var marker = markerLayer.getLayer(this.id);
                            marker.closePopup();
                            map.panTo(marker.getLatLng());
                            marker.bounce(2);
                        }

                    }, dataLoader);
                    
                    var unpinMeeting = L.DomUtil.create('button', 'btn btn--icon-only', meetingDetail);
                    
                    unpinMeeting.innerHTML = '<span class="screen-reader-only">Remove</span>' +
                                            '<span class="fas fa-times btn__icon"></span>';

                    unpinMeeting.setAttribute("title", "Remove");
                    
                    L.DomEvent.on(unpinMeeting, 'click', function () {
                        markerLayer.getLayer(this.id).closePopup();
                        this.parentNode.removeChild(this);
                    }, dataLoader);
                });
            }
        }

        watchMediaQuery(mediaQuery);
        mediaQuery.addListener(watchMediaQuery);

    });
    
}

// createMarker(
//     [40.628910, -74.114570],
//     closedMeeting, 
//     "Carl's House",
//     "471 Broadway,<br>Staten Island, NY 10301"
// );

// createMarker(
//     [40.632000, -74.132060],
//     closedMeeting, 
//     "Jaywalker Club",
//     "945 Post Ave,<br>Staten Island, NY 10302"
// );

// createMarker(
//     [40.639150, -74.076800],
//     openMeeting, 
//     "Project Hospitality Cafe",
//     "100 Central Ave,<br>Staten Island, NY 10301"
// );

// createMarker(
//     [40.533780, -74.189230],
//     openMeeting, 
//     "Steps to the Stars",
//     "5371 Amboy Rd,<br>Staten Island, NY 10312"
// );

window.addEventListener('resize', setMapHeight);

//////////////////////////////////////////////
// D. Custom Map Buttons
//////////////////////////////////////////////

const zoomInButton = document.querySelector('[data-map-zoom-in]');
const zoomOutButton = document.querySelector('[data-map-zoom-out]');
const toggleLocationButton = document.querySelector('[data-toggle-locations]');

map.on("zoomend", function () {
    let currentZoom = map.getZoom();
    let maxZoom = map.options.maxZoom;
    let minZoom = map.options.minZoom;

    if (currentZoom >= maxZoom) {
        zoomInButton.disabled = true;
    } else {
        zoomInButton.disabled = false;
    }

    if (currentZoom <= minZoom) {
        zoomOutButton.disabled = true;
    } else{
        zoomOutButton.disabled = false;
    }
});

zoomInButton.addEventListener('click', function (event) {
   map.zoomIn();
});

zoomOutButton.addEventListener('click', function (event) {
    map.zoomOut()
});

toggleLocationButton.addEventListener('click', function () {

    if( sidebarShown === false){
        mapTarget.classList.add("data-shown");
        sidebarShown = true;
    } else if ( sidebarShown === true) {
        mapTarget.classList.remove("data-shown");
        sidebarShown = false;
    }

    map.invalidateSize(true);

});

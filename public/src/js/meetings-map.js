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
// B. Leaflet Map
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
    
    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        id: 'mapbox/streets-v11',
        accessToken: 'pk.eyJ1IjoiY2F2aWRhbm8iLCJhIjoiY2tkY3ZzdHUyMTB3azJ6b2JtbTNhODkybSJ9.zor-mM9NBBaRSuJKhwPh7g',
        tileSize: 512,
        zoomOffset: -1
    }).addTo(map);
});

function centerMap(myBounds){
    map.fitBounds(myBounds.getBounds());
}

// Custom popup options

var openMeeting = new Icon( { iconUrl: myPath + '/images/map-pin-open.svg'} );
var closedMeeting = new Icon( { iconUrl: myPath + '/images/map-pin-closed.svg'} );

// Create Markers

var markerLayer = L.layerGroup([]).addTo(map);

function init() {
    gapi.client.init({
        'apiKey': 'AIzaSyAa12ysdSNieKzVAb_jsAy_pV6gH9phlOs',
    }).then(function () {
        return gapi.client.request({
            'path': 'https://sheets.googleapis.com/v4/spreadsheets/18q9JqQbP_d8_27c9yePyixkhFsUAiJ9yOlkhTmfu-v4/values/sigsMeetingList',
        })
    }).then(function (response) {

        // console.log(response.result);

        const columnHeaderList = new Array();

        // Create Column Headers Array
        for (const columnHeader of response.result.values[0]) {
            columnHeaderList.push(columnHeader);
        }

        let addressIndex = columnHeaderList.indexOf('locationStreetAddress');
        let zipCodeIndex = columnHeaderList.indexOf('locationZipCode');
        let meetingNameIndex = columnHeaderList.indexOf('meetingName');
        let meetingTypesIndex = columnHeaderList.indexOf('meetingTypes');

        console.log(addressIndex, zipCodeIndex);

        let cityState = 'Staten Island, NY';

        for (const locationData of response.result.values) {

            var coords, marker;

            let locationAddress = locationData[addressIndex] + ' ' + cityState + ' ' + locationData[zipCodeIndex];

            let meetingName = locationData[meetingNameIndex];

            let meetingTypesList = locationData[meetingTypesIndex].toString();

            let primaryMeetingType = meetingTypesList.trim().split(';')[0];

            console.log(primaryMeetingType);



            
            
            L.esri.Geocoding.geocode().address(locationAddress).run((err, results) => {

                if (err) {
                    return;
                } else {
                    coords = results.results[0].latlng;
                }

                marker = L.marker(coords, { icon: openMeeting, riseOnHover: true }).addTo(map);

                var contentPopUp = '<a href="#1" class="text-primary"><strong>' + meetingName + '</strong></a>' + 
                                   '<p class="meeting__address">' + locationData[addressIndex] + '<br>' + cityState + ' ' + locationData[zipCodeIndex] + '</p>' +
                                   '<p class="meeting__type">' + primaryMeetingType + '</p>'

                marker.bindPopup(contentPopUp);

            });

        }

    }, function (reason) {
        console.log('Error: ' + reason.result.error.message);
    });
};

gapi.load('client', init);



// function createMarker(
//     meetingType,
//     meetingTitle,
//     streetAddress,
//     zipCode
// ) {

//     var meeting;

//     var coords, marker;

//     if( meetingType === closedMeeting ){
//         meeting = 'Closed';
//     } else if ( meetingType === openMeeting ) {
//         meeting = 'Open';
//     }

//     var cityState = "Staten Island, NY";

//     var locationAddress = streetAddress + " " + cityState + " " + zipCode;
    
//     L.esri.Geocoding.geocode().address(locationAddress).run((err, results, response) => {

//         if (err) {
//             return;
//         } else {
//             coords = results.results[0].latlng;
//         }   
        
//     marker = L.marker(coords, { icon: meetingType }).addTo(markerLayer);
//         var contentPopUp = '<a href="#1" class="text-primary"><strong>' + meetingTitle + '</strong></a>' + 
//                            '<p class="meeting__address">' + streetAddress + '<br>' + cityState + ' ' + zipCode + '</p>'

//         var contentSidebar = '<p class="meeting__title">' + meetingTitle + '</p>' +
//                              '<p class="meeting__type">' + meeting + ' Discussion' + '</p>' +
//                              '<p class="meeting__address">' + streetAddress + '<br>' + cityState + ' ' + zipCode + '</p>';

//         marker.bindPopup(contentPopUp);
//     });
    

//         // var mediaQuery = window.matchMedia('( max-width: 1000px )');

//         // function watchMediaQuery(event) {

//         //     if (event.matches) {
//         //         return;
//         //     } else {

//         //         marker.on('click', function (event) {

//         //             if (sidebarShown === false) {
//         //                 mapTarget.classList.add('data-shown');
//         //                 sidebarShown = true;
//         //                 map.invalidateSize(true);
//         //             }

//         //             var id = L.Util.stamp(event.target);

//         //             if (document.getElementById(id) != null) return;

//         //             var dataLoader = L.DomUtil.create('div', 'dataLoader', document.getElementById('data-loader'));

//         //             dataLoader.id = id;
                    
//         //             var meetingDetail = L.DomUtil.create('div', 'meeting-detail' + ' ' + meeting.toLowerCase() + ' ' + 'border-bottom', dataLoader);
//         //             meetingDetail.innerHTML = contentSidebar;
                    
//         //             meetingDetail.setAttribute("tabindex", 0);

//         //             meetingDetail.setAttribute("data-highlight", "true");

//         //             setTimeout( function() {
//         //                 meetingDetail.setAttribute("data-highlight", "false");
//         //             }, 2000)
                    
//         //             L.DomEvent.on( meetingDetail, 'click', function (event) {

//         //                 if( event.target.classList.contains('btn')) {
//         //                     event.preventDefault();
//         //                 } else {
//         //                     var marker = markerLayer.getLayer(this.id);
//         //                     marker.closePopup();
//         //                     map.panTo(marker.getLatLng());
//         //                     marker.bounce(2);
//         //                 }

//         //             }, dataLoader);
                    
//         //             var unpinMeeting = L.DomUtil.create('button', 'btn btn--icon-only', meetingDetail);
                    
//         //             unpinMeeting.innerHTML = '<span class="screen-reader-only">Remove</span>' +
//         //                                     '<span class="fas fa-times btn__icon"></span>';

//         //             unpinMeeting.setAttribute("title", "Remove");
                    
//         //             L.DomEvent.on(unpinMeeting, 'click', function () {
//         //                 markerLayer.getLayer(this.id).closePopup();
//         //                 this.parentNode.removeChild(this);
//         //             }, dataLoader);
//         //         });
//         //     }
//         // }

//         // watchMediaQuery(mediaQuery);
//         // mediaQuery.addListener(watchMediaQuery);
        

    
// }

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

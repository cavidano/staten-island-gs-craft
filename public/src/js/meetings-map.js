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
    minZoom: 10,
    maxZoom: 17,
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
    L.tileLayer('https://api.mapbox.com/styles/v1/{user}/{id}/tiles/{tileSize}/{z}/{x}/{y}?access_token={accessToken}', {
        user: 'cavidano',
        id: 'ckdra9cus0rv11aqo0iawtcou',
        accessToken: 'pk.eyJ1IjoiY2F2aWRhbm8iLCJhIjoiY2tkY3ZzdHUyMTB3azJ6b2JtbTNhODkybSJ9.zor-mM9NBBaRSuJKhwPh7g',
        tileSize: 256
    }).addTo(map);
    
});

function centerMap(myBounds){
    map.fitBounds(myBounds.getBounds());
}

// Custom popup options

var meetingIconSingle = new Icon( { iconUrl: myPath + '/images/map-pin-single.svg' });
var meetingIconMultiple = new Icon({ iconUrl: myPath + '/images/map-pin-multiple.svg' });

// Create Markers

var markerLayer = L.layerGroup([]).addTo(map);

//////////////////////////////////////////////
// A. Get Spreadsheet Data
//////////////////////////////////////////////

function init() {
    gapi.client.init({
        'apiKey': 'AIzaSyAa12ysdSNieKzVAb_jsAy_pV6gH9phlOs',
    }).then(function () {
        return gapi.client.request({
            'path': 'https://sheets.googleapis.com/v4/spreadsheets/18q9JqQbP_d8_27c9yePyixkhFsUAiJ9yOlkhTmfu-v4/values/sigsMeetingListv2',
        })
    }).then(function (response) {

        // Set Response as Variable
        const dataList = response.result.values;

        console.log("My Raw Data...", dataList);

        // Create Columns Array
        let columnHeaderList = [];

        // Create Column Headers Array
        for (const columnHeader of dataList[0]) {
            columnHeaderList.push(columnHeader);
        }

        var itemsContainer = [""];
        
        var i = 0;

        // Print Data Rows
        dataList.forEach((dataRow) => {
        
            // Get All Rows Excluding Column Headers
            if (dataRow[0] !== columnHeaderList[0]) {

                let rowItem = dataRow;

                for (const [index, dataCell] of rowItem.entries()) {

                    if (dataCell !== "") {
                        rowItem[index] = dataCell;
                    } else {
                        if (itemsContainer.length > 1) {
                            rowItem[index] = itemsContainer[i-1][index]
                        }
                    }
                }

                itemsContainer.push(rowItem);

            } // end 

            i++;

        });

        var itemsContainer = itemsContainer.filter(function (el) {
            return el != "";
        });

        console.log("itemsContainer ==> ", itemsContainer);

        var locationsList = [];

        for (const [index, item] of itemsContainer.entries()) {
            locationsList.push(item[0]);
        }

        locations = Array.from(new Set(locationsList));
        
        console.log("locations ==> ", locations);

        // Map it

        for (const [index, location] of locations.entries()) {

            console.log("location ==> ", index, location);

            let locationAddress = location;

            let locationMeetings = itemsContainer.filter(item => item.includes(location));

            let locationName = locationMeetings[0][2];

            console.log("locationName ==> ", index, locationName);

            console.log("locationMeetings ==> ", index, locationMeetings);

            // location meetings

            var coords, marker;

            L.esri.Geocoding.geocode().address(locationAddress).run((err, results) => {

                if (err) {
                    return;
                } else {
                    coords = results.results[0].latlng;
                }

                if (locationMeetings.length > 1) {
                    var meetingCountLabel = "Meetings";
                    meetingIcon = meetingIconMultiple;
                } else {
                    var meetingCountLabel = "Meeting";
                    meetingIcon = meetingIconSingle;
                }

                marker = L.marker(coords, {
                    icon: meetingIcon,
                    riseOnHover: true
                }).addTo(map);

                let address1 = locationAddress.split(/,(.+)/)[0];
                let address2 = locationAddress.split(/,(.+)/)[1];

                var contentPopUp = `<a href="#1" class="text-primary">
                                        <strong>${locationName}</strong>
                                    </a>
                                    <p class="meeting__address">
                                        ${address1}<br>
                                        ${address2}
                                    </p>
                                    <p class="meeting__count">
                                        ${locationMeetings.length} ${meetingCountLabel}
                                    </p>`;

                var contentSidebar = '<p class="meeting__title">' + locationName + '</p>' +
                        '<p class="meeting__address">' + address1 + '<br>' + address2 + '</p>' +
                        '<hr>'

                marker.bindPopup(contentPopUp);

                //////////////////////////////////////////////
                // A. Desktop Marker Action
                //////////////////////////////////////////////

                var mediaQuery = window.matchMedia('( max-width: 1000px )');

                function watchMediaQuery(event) {

                    if (event.matches) {
                        return;
                    } else {

                        var dataLoader = document.getElementById('data-loader');

                        marker.on('click', function (event) {

                            if (sidebarShown === false) {
                                mapTarget.classList.add('data-shown');
                                sidebarShown = true;
                                map.invalidateSize(true);
                            }

                            dataLoader.innerHTML = contentSidebar;

                        });
                    }
                }

                watchMediaQuery(mediaQuery);
                mediaQuery.addListener(watchMediaQuery);

            });

        }

        const myJSON = JSON.stringify(itemsContainer);
        console.log("JSON ==> ", myJSON);

    }, function (reason) {
        console.log('Error: ' + reason.result.error.message);
    });
};

gapi.load('client', init);

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
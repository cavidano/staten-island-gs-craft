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

    let mapFrank = 'ckdrl3agu02vu19n5o868p9pq';
    let mapClassic = 'ckdra9cus0rv11aqo0iawtcou'

    L.tileLayer('https://api.mapbox.com/styles/v1/{user}/{id}/tiles/{tileSize}/{z}/{x}/{y}?access_token={accessToken}', {
        user: 'cavidano',
        id: mapClassic,
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

        // console.log("My Raw Data...", dataList);

        // Create Columns Array
        let columnHeaderList = [];

        // Create Column Headers Array
        for (const columnHeader of dataList[0]) {
            columnHeaderList.push(columnHeader);
        }

        var itemsAsArrays = [""];
        var itemsAsObjects = [];

        // Print Data Rows
        dataList.forEach((dataRow, i) => {

            // Get All Rows Excluding Column Headers
            if (dataRow[0] !== columnHeaderList[0]) {

                let rowItem = Array.from(dataRow);

                for (const [index, dataCell] of rowItem.entries()) {

                    if (dataCell !== "") {
                        rowItem[index] = dataCell;
                    } else {
                        if (itemsAsArrays.length > 1) {
                            rowItem[index] = itemsAsArrays[i - 1][index]
                        }
                    }
                }

                itemsAsArrays.push(rowItem);

            } // end for

        });

        // Remove Empty Placeholder in itemsAsArrays
        var itemsAsArrays = itemsAsArrays.filter(function (el) {
            return el != "";
        });

        // console.log("itemsAsArrays ==> ", itemsAsArrays);

        itemsAsArrays.forEach((rowItem) => {

            let rowObject = {}
            let keys = columnHeaderList;
            let values = rowItem;

            keys.forEach((key, i) => {
                rowObject[key] = values[i];
            });

            itemsAsObjects.push(rowObject);

        });

        // console.log("itemsAsObjects ==> ", itemsAsObjects);

        // const myJSON = JSON.stringify(itemsAsObjects);
        // console.log("JSON ==> ", myJSON);

        // Get Locations

        var locationsList = [];
        var weekdaysList = [];

        itemsAsArrays.forEach(entry => {
            locationsList.push(entry[0]);
        })

        locations = Array.from(new Set(locationsList));


        itemsAsArrays.forEach(entry => {
            weekdaysList.push(entry[3]);
        });

        weekdays = Array.from(new Set(weekdaysList));

        // console.log("locations ==> ", locations);

        //////////////////////////////////////////////
        // Map Data
        //////////////////////////////////////////////

        locations.forEach((location, index) => {

            // console.log("location ==> ", index, location);

            let locationAddress = location;

            let locationMeetings = itemsAsObjects.filter(meeting => meeting.locationAddress === location);

            let locationName = locationMeetings[0].locationName;

            // console.log("locationName ==> ", index, locationName);

            // console.log("locationMeetings ==> ", index, locationMeetings);

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

                var contentlocationPopUp = 

                   `<a href="#1" class="text-primary">
                        <strong>${locationName}</strong>
                    </a>
                    <p class="meeting__address">
                        ${address1}<br>
                        ${address2}
                    </p>
                    <p class="meeting__count">
                        ${locationMeetings.length} ${meetingCountLabel}
                    </p>`;

                var contentLocationOverview =

                    `<div class="data__location">
                        <p class="meeting__title">
                            <strong>${locationName}</strong>
                        </p>
                        <p class="meeting__address margin-bottom-1">
                            ${address1}<br>
                            ${address2}
                        </p>
                        <a class="btn btn--has-icon background-light text-primary rounded font-size-sm" href="http://maps.google.com/?q=${locationAddress}" target="_blank">
                            <span class="fas fa-directions fa-lg btn__icon"></span>
                            <span class="btn__text">Directions</span>
                        </a>
                    </div>`;

                var contentLocationDetail =

                    `<div class="data__meetings">
                        <div class="meeting-list">

                            ${locationMeetings.map((meeting, index, array) => {

                                var previousDay;
                                var weekday = meeting.meetingDay;

                                if(index >= 1){ 
                                    previousDay = array[index-1].meetingDay;
                                }

                                var meetingInfo =
                                               `<span class="meeting__name"><em>${meeting.meetingName}</em></span>
                                                <span class="meeting__time">${meeting.meetingStartTime} - ${meeting.meetingEndTime}</span>
                                                <span class="meeting__discussion">${meeting.discussionType}</span>`

                                if (weekday !== previousDay) {
                                   return `
                                        <span class="meeting__day"><strong>${weekday}</strong></span>
                                        ${meetingInfo}`
                                } else{
                                    return `${meetingInfo}`
                                }

                            }).join('')}

                        </div>
                    </div>`;
                                      
                marker.bindPopup(contentlocationPopUp);

                //////////////////////////////////////////////
                // Desktop Marker Action
                //////////////////////////////////////////////

                var mediaQuery = window.matchMedia('( max-width: 1000px )');

                function watchMediaQuery(event) {

                    if (event.matches) {
                        return;
                    } else {

                        var dataLoader = document.getElementById("data-loader");
                        var dataOverview = document.getElementById("location-overview");
                        var dataDetail = document.getElementById("location-detail");

                        marker.on('click', function (event) {

                            if (sidebarShown === false) {
                                mapTarget.classList.add('data-shown');
                                sidebarShown = true;
                                map.invalidateSize(true);
                            }

                            dataOverview.innerHTML = contentLocationOverview;
                            dataDetail.innerHTML = contentLocationDetail;

                        });
                    }
                }

                watchMediaQuery(mediaQuery);
                mediaQuery.addListener(watchMediaQuery);

            });

        });

        // const myJSON = JSON.stringify(itemsAsArrays);
        // console.log("JSON ==> ", myJSON);

    }, function (reason) {
        // console.log('Error: ' + reason.result.error.message);
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
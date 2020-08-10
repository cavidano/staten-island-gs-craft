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

var meetingIcon = new Icon( { iconUrl: myPath + '/images/map-pin-open.svg'} );
var closedMeeting = new Icon( { iconUrl: myPath + '/images/map-pin-closed.svg'} );

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

        // Print Column Headers Array
        // console.log("columnHeaderList:", columnHeaderList);

        let itemContainer = new Array();

        let rowItemParent = new Object();

        let i = 0;

        // Print Data Rows
        for (const dataRow of dataList) {

            // Get All Rows Excluding Column Headers
            if (dataRow[0] !== columnHeaderList[0]) {
            
                // Populate Object Prototype
                if (Object.keys(rowItemParent).length === 0) {
                    columnHeaderList.forEach((key, index) => {
                        rowItemParent[key] = dataRow[index];
                        console.log("rowItemParent => ", key, " = ", dataRow[index])
                    });
                }

                let rowItem = Object.create(rowItemParent);
            
                console.log("rowItem", rowItem);

                for (const [index, dataCell] of dataRow.entries()) {
                    if (dataCell !== "") {
                        rowItem[columnHeaderList[index]] = dataRow[index];
                    }
                }

                itemContainer.push(rowItem);

                // whoa!!!!

            }

            i = i+1;
        }

        // console.log("itemContainer =>", itemContainer);

        const items = itemContainer;

        const locations = new Array();
        
        const meetings = new Array();

        // Separate Locations
        class Location {
            constructor(
                locationName,
                locationAddress,
                locationMeetings
            ) {
                this.locationName = locationName;
                this.locationAddress = locationAddress;
                this.locationMeetings = locationMeetings = function(){
                    return meetings.filter(Meeting => Meeting.locationAddress == this.locationAddress)
                };
            }
        }

        // Separate Meeting
        class Meeting {
            constructor(
                locationAddress,
                locationName,
                meetingName,
                meetingWeekday,
                meetingStartTime,
                meetingEndTime, 
                meetingType
            ) {
                this.locationAddress = locationAddress;
                this.locationName = locationName;
                this.meetingName = meetingName;
                this.meetingWeekday = meetingWeekday;
                this.meetingStartTime = meetingStartTime;
                this.meetingEndTime = meetingEndTime;
                this.meetingType = meetingType;
            }
        }

        for (const item of items) {

            // Get Addresses
            if (item.hasOwnProperty("locationAddress")) {
                const NewLocation = new Location(
                    item.locationName,
                    item.locationAddress,
                );

                locations.push(NewLocation);
            }

            // Get Meetings
            const newMeeting = new Meeting(
                item.locationAddress,
                item.locationName,
                item.meetingName,
                item.meetingWeekday,
                item.meetingStartTime,
                item.meetingEndTime,
                item.meetingType
            );

            meetings.push(newMeeting);
        }

        console.log("locations =>", locations);
        console.log("meetings =>", meetings);

        var allMeetingsJSON = JSON.stringify(meetings);
        console.log(allMeetingsJSON);

        for (const location of locations) {

            var coords, marker;

            let locationAddress = location.locationAddress;
     
            let locationName = location.locationName;

            let locationMeetings = location.locationMeetings();

           console.log(locationMeetings);

            L.esri.Geocoding.geocode().address(locationAddress).run((err, results) => {

                if (err) {
                    return;
                } else {
                    coords = results.results[0].latlng;
                }

                marker = L.marker(coords, {
                    icon: meetingIcon,
                    riseOnHover: true
                }).addTo(map);

                var contentPopUp = '<a href="#1" class="text-primary"><strong>' + locationName + '</strong></a>' + '</p>' +
                                   '<p class="meeting__address">' + locationAddress + '</p>' 

                marker.bindPopup(contentPopUp);

            });            

        }

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

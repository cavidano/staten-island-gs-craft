//////////////////////////////////////////////
// A. Global Variables
//////////////////////////////////////////////

const mapTarget = document.getElementById("map-view");
const listTarget = document.getElementById("list-loader");

let sidebarShown = false;

//////////////////////////////////////////////
// B. Map Height
//////////////////////////////////////////////

function setMapHeight() {
    let windowHeight = window.innerHeight;
    let mapTargetPos = mapTarget.offsetTop;
    let adjustedHeight = windowHeight - mapTargetPos + "px";
    
    mapTarget.style.height = adjustedHeight;
}

setMapHeight();
window.addEventListener('resize', setMapHeight());

//////////////////////////////////////////////
// B. Leaflet Map
//////////////////////////////////////////////

const map = L.map('map-loader', {
    center: [40.5795, -74.1502],
    setZoom: 14,
    minZoom: 10,
    maxZoom: 17,
    scrollWheelZoom: false,
    attributionControl: false,
    zoomControl: false,
});

const myPath = ".";

// Create custom pin

const Icon = L.Icon.extend({
    options: {
        iconSize: [30, 45],
        iconAnchor: [15, 45],
        shadowSize: [45, 22.5],
        shadowAnchor: [22.5, 22.5],
        shadowUrl: myPath + '/images/map-pin-shadow-2.svg',
        popupAnchor:  [0, -50]
    }
});

// Load SI Bounds

const siGeo = new L.GeoJSON.AJAX('./lib/geojson/statenIsland.geojson');

siGeo.on('data:loaded', () => {
    centerMap(siGeo);
    
    const mapCustom = 'ckdwypx770g1c19mlk4lbi835';

    L.tileLayer('https://api.mapbox.com/styles/v1/{user}/{id}/tiles/{tileSize}/{z}/{x}/{y}?access_token={accessToken}', {
        user: 'cavidano',
        id: mapCustom,
        accessToken: 'pk.eyJ1IjoiY2F2aWRhbm8iLCJhIjoiY2tkY3ZzdHUyMTB3azJ6b2JtbTNhODkybSJ9.zor-mM9NBBaRSuJKhwPh7g',
        tileSize: 256
    }).addTo(map);
    
});

function centerMap(myBounds){
    map.fitBounds(myBounds.getBounds());
}

// Custom popup options

const meetingIconSingle = new Icon( { iconUrl: myPath + '/images/map-pin-single.svg' });
const meetingIconMultiple = new Icon({ iconUrl: myPath + '/images/map-pin-multiple.svg' });

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
        for (let columnHeader of dataList[0]) {
            columnHeaderList.push(columnHeader);
        }

        var itemsAsArrays = [""];
        var itemsAsObjects = [];

        // Print Data Rows
        dataList.forEach((dataRow, i) => {

            // Get All Rows Excluding Column Headers
            if (dataRow[0] !== columnHeaderList[0]) {

                let rowItem = Array.from(dataRow);

                for (let [index, dataCell] of rowItem.entries()) {

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

        console.log("itemsAsArrays ==> ", itemsAsArrays);

        itemsAsArrays.forEach((rowItem) => {

            let rowObject = {}
            let keys = columnHeaderList;
            let values = rowItem;

            keys.forEach((key, i) => {
                rowObject[key] = values[i];
            });

            itemsAsObjects.push(rowObject);

        });

        console.log("itemsAsObjects ==> ", itemsAsObjects);
        
        let weekdayMeetings;
        let markerLayer;

        function displayMeetings(displayList) {

            markerLayer = L.layerGroup([]).addTo(map);

            if (weekdayMeetings !== undefined) {
                listTarget.querySelectorAll('div').forEach(el => el.remove());
                console.log("shoooooooooooooo", weekdayMeetings);
                map.removeLayer(markerLayer);
            } else {
                console.log("Refreshhhhhhhhhhhhhhhhhhhhhhhhhed", weekdayMeetings);
            }

            // Get Locations

            let locationsList = [];

            displayList.forEach(entry => {
                locationsList.push(entry.locationAddress);
            });

            locations = Array.from(new Set(locationsList));

            // console.log("locations ==> ", locations);

            let weekdayList = [];

            displayList.forEach(entry => {
                weekdayList.push(entry.meetingDay);
            });

            weekdays = Array.from(new Set(weekdayList));

            //////////////////////////////////////////////
            // Map and List Data
            //////////////////////////////////////////////

            locations.forEach((location) => {

                let locationAddress = location;

                // console.log("location ==> ", index, location);

                let locationMeetings = displayList.filter(meeting => meeting.locationAddress === location);

                let locationName = locationMeetings[0].locationName;

                // console.log("locationName ==> ", index, locationName);

                // console.log("locationMeetings ==> ", locationMeetings);

                // Map View

                let coords, marker;

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

                    formatAddress(locationAddress);

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

                    let contentLocationOverview =

                        `<div class="data__location">
                            <p class="location__title font-size-md">
                                <strong>${locationName}</strong>
                            </p>
                            <p class="meeting__address font-size-sm margin-bottom-1">
                                ${address1}<br>
                                ${address2}
                            </p>
                            <ul class="nav nav--horizontal nav--divider border text-primary font-size-sm rounded">
                                <li>
                                    <a class="btn btn--has-icon" href="http://maps.google.com/?q=${locationAddress}" target="_blank">
                                        <span class="fas fa-map-marker-alt fa-lg btn__icon"></span>
                                        <span class="btn__text">Directions</span>
                                    </a>
                                </li>
                                <li>
                                    <a class="btn btn--has-icon" href="#1">
                                        <span class="far fa-arrow-alt-circle-right fa-lg btn__icon"></span>
                                        <span class="btn__text">Details</span>
                                    </a>
                                </li>
                            </ul>
                        </div>`;

                    let contentLocationDetail =

                        `<div class="data__meetings">
                            <div class="meeting-list">

                                ${locationMeetings.map((meeting, index, array) => {

                                    var previousDay;

                                    var weekday = meeting.meetingDay;

                                    if(index >= 1){ 
                                        previousDay = array[index-1].meetingDay;
                                    }

                                    var meetingInfo =
                                    `<span class="meeting__name">
                                            <em>${meeting.meetingName}</em>
                                        </span>
                                        <span class="meeting__time">${meeting.meetingStartTime} - ${meeting.meetingEndTime}</span>
                                        <span class="meeting__discussion">${meeting.discussionType}</span>`

                                    if (weekday !== previousDay) {
                                    return `
                                            <span class="meeting__day">
                                                <strong>${weekday}</strong>
                                            </span>
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

                            var dataOverview = document.getElementById("location-overview-loader");
                            var dataDetail = document.getElementById("location-detail-loader");

                            marker.on('click', () => {

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

            weekdays.forEach((day) => {

                let weekday = day;

                console.log("weekday ==> ", weekday);

                let dailyMeetings = displayList.filter(meeting => meeting.meetingDay === weekday);

                // console.log("dailyMeetings ==> ", dailyMeetings);

                weekdayMeetings = document.createElement("div");

                let contentMeetingList = `

                    <div class="margin-y-4">

                        <h2 class="font-weight-normal">${weekday}</h2>

                        <table class="table table--stack--lg font-size-md theme-white font-size-md box-shadow-1 rounded margin-y-3">

                            <caption id="table-caption-01" class="screen-reader-only">
                                Staten Island A.A. Meetings
                            </caption>

                            <thead>
                                <tr>
                                    <th scope="col" style="width: 20%;">Time</th>
                                    <th scope="col" style="width: 20%;">Meeting Name</th>
                                    <th scope="col" style="width: 25%;">Location</th>
                                    <th scope="col" style="width: 20%;">Types</th>
                                    <th scope="col" style="width: 15%;">
                                        <span class="screen-reader-only">Action</span>
                                    </th>
                                </tr>
                            </thead>

                            <tbody>

                            ${dailyMeetings.map((meeting) => {

                                let locationAddress = meeting.locationAddress;

                                formatAddress(locationAddress);

                                return `
                                <tr>
                                    <td>
                                        ${meeting.meetingStartTime.toLowerCase()}-${meeting.meetingEndTime.toLowerCase()}
                                    </td>
                                    <td>
                                        <span class="display-block">
                                            ${meeting.meetingName}</span>
                                        </span>
                                    </td>
                                    <td>
                                        <em>${meeting.locationName}</em>
                                        <span class="display-block">
                                            ${address1}<br>
                                            ${address2}
                                        </span>
                                    </td>
                                    <td>
                                        <span class="display-block">${meeting.discussionType}</span>
                                        <span class="display-block">Steps &amp; Traditions</span> 
                                    </td>
                                    <td>
                                        <ul class="nav nav--gap-0 font-size-sm text-primary margin-left-auto">
                                            <li>
                                                <a class="btn btn--has-icon" href="http://maps.google.com/?q=${locationAddress}" target="_blank">
                                                    <span class="fas fa-map-marker-alt fa-lg btn__icon"></span>
                                                    <span class="btn__text">Directions</span>
                                                </a>
                                            </li>
                                            <li>
                                                <a class="btn btn--has-icon" href="#1">
                                                    <span class="far fa-arrow-alt-circle-right fa-lg btn__icon"></span>
                                                    <span class="btn__text">Details</span>
                                                </a>
                                            </li>
                                        </ul>
                                    </td>
                                </tr>`

                            }).join('')}
                            
                            </tbody>

                        </table>

                    </div>`;

                weekdayMeetings.innerHTML = contentMeetingList;

                listTarget.appendChild(weekdayMeetings);
                
            });            
        }

        displayMeetings(itemsAsObjects);
        loadNycCoreJS();
        
        // Filters

        const selectElement = document.querySelector('#select-weekday');

        selectElement.addEventListener('change', (event) => {
            let myFilter = event.target.value;
            let dayFilter = itemsAsObjects.filter(meeting => meeting.meetingDay === myFilter);
            displayMeetings(dayFilter);
        });

        // const myJSON = JSON.stringify(itemsAsObjects);
        // console.log("JSON ==> ", myJSON);

    }, function (reason) {
        console.log("Error: ", reason.result.error.message);
    });
};

gapi.load('client', init);

// Format Address

var address1, address2;

function formatAddress(address) {
    address1 = address.split(/,(.+)/)[0];
    address2 = address.split(/,(.+)/)[1];
}

//////////////////////////////////////////////
// D. Custom Map Buttons
//////////////////////////////////////////////

const zoomInButton = document.querySelector('[data-map-zoom-in]');
const zoomOutButton = document.querySelector('[data-map-zoom-out]');
const toggleLocationButton = document.querySelector('[data-toggle-locations]');

map.on("zoomend", () => {

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

zoomInButton.addEventListener('click',() => {
   map.zoomIn();
});

zoomOutButton.addEventListener('click', () => {
    map.zoomOut()
});

toggleLocationButton.addEventListener('click', () => {

    if( sidebarShown === false){
        mapTarget.classList.add("data-shown");
        sidebarShown = true;
    } else if ( sidebarShown === true) {
        mapTarget.classList.remove("data-shown");
        sidebarShown = false;
    }

});

function loadNycCoreJS(){

    const nycCoreJS = document.createElement('script');
    nycCoreJS.src = 'https://cdn.jsdelivr.net/gh/CityOfNewYork/nyc-core-framework@new-version/dist/js/nyc_core.js';

    nycCoreJS.onload = () => {
        // console.log("I AM LOADED!");
    }

    document.head.append(nycCoreJS);
}
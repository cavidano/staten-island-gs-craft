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

        // Print Data Rows
        for (const dataRow of dataList) {

            // Get All Rows Excluding Column Headers
            if (dataRow[0] !== columnHeaderList[0]) {

                // Populate Object Prototype
                if (Object.keys(rowItemParent).length === 0) {
                    columnHeaderList.forEach((key, index) => {
                        rowItemParent[key] = dataRow[index];
                    });
                }
            
                const rowItem = Object.create(rowItemParent);

                let n = 0;
      
                for (const dataCell of dataRow) {

                    if(dataCell !== ""){
                        rowItem[columnHeaderList[n]] = dataRow[n];
                    }

                    n++;
                }

                itemContainer.push(rowItem);
            }
        }

        // console.log("itemContainer =>", itemContainer);
                     
        const items = itemContainer;

        const locations = new Array();

        // Separate Locations
        class Location {
            constructor(
                locationName,
                locationAddress,
            ) {
                this.locationName = locationName;
                this.locationAddress = locationAddress;
            }
        }

        for(const item of items){

            // Get Addresses First
            if (item.hasOwnProperty("locationAddress")) {

                let NewLocation = new Location(item.locationName, item.locationAddress);
                locations.push(NewLocation);
            }

        }
        
        // console.log("locations =>", locations);

        // var myJSON = JSON.stringify(locations);
        // console.log(myJSON);
        
    }, function (reason) {
        console.log('Error: ' + reason.result.error.message);
    });
};

gapi.load('client', init);
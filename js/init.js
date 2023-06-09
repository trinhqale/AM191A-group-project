// DEFINE GLOBAL VARIABLES
let mapOptions = { 'center': [34.0709, -118.444], 'zoom': 10 };
const map = L.map('the_map').setView(mapOptions.center, mapOptions.zoom);

const MAP_PATH = "data/ca_zipcodes.geojson";
const DATA_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRCF24Aalv8tZ3neF_4LZQ21KLokn5jtZgpc9-wiAuDhT1_LXNYtxKRtsM-eo0UAzhGUHqQvJCgCNmI/pub?output=csv";

// 6 Layers for displaying different results
// care = caregiver, noncare = non-caregiver
let carePositiveLayer = L.featureGroup();
let careNegativeLayer = L.featureGroup();
let careNeutralLayer = L.featureGroup();
let noncarePositiveLayer = L.featureGroup();
let noncareNegativeLayer = L.featureGroup();
let noncareNeutralLayer = L.featureGroup();

// track count
let responseCount = {
    "carePosCount": 0,
    "careNeuCount": 0,
    "careNegCount": 0,
    "nonPosCount": 0,
    "nonNeuCount": 0,
    "nonNegCount": 0,
};


// whether to display postive/negative/neutral experience 
let displayPositiveResponses = true;
let displayNegativeResponses = true;
let displayNeutralResponses = true;

// whether to display caregiver or non-caregiver
let displayCaregiver = true;
let displayNonCaregiver = true;

// change map type
let Jawg_Light = L.tileLayer('https://{s}.tile.jawg.io/jawg-light/{z}/{x}/{y}{r}.png?access-token={accessToken}', {
    attribution: '<a href="http://jawg.io" title="Tiles Courtesy of Jawg Maps" target="_blank">&copy; <b>Jawg</b>Maps</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    minZoom: 0,
    maxZoom: 22,
    subdomains: 'abcd',
    accessToken: 'FkWnkf1e22dnL71CnkeDRnZeEZRyPNd6DqNr2frT4o5zPMcnKvgfcgG2gQCNjnR7'
});
Jawg_Light.addTo(map);

function loadData(url) {
    Papa.parse(url, {
        header: true,
        download: true,
        complete: results => processData(results.data)
    })
}

/**
 * Prepare
 * @param {*} results 
 */
function processData(data) {
    let allResponses = [];
    data.forEach(column => {
            let userResponse = getUserResponseData(column)
            allResponses.push(userResponse)
        });
    getBoundary(MAP_PATH, allResponses);
    populateTable(allResponses);
    // map bounds
    let latlngs = [];
    allResponses.forEach(response => {
        // if zipcode is valid (aka not empty)
        if (response.zipcode.length > 0) {
            latlngs.push([response.latlng]);
        }
    })
    map.fitBounds(latlngs);
}

/**
 * Helper for processData, which adds responses to layers 
 * @param {*} data, JSON data: list
 */
function getUserResponseData(data) {
    let userZipcode = data['What is the zip code of your primary home?'];
    let userExperience = data['Overall, what would you rate your work life balance?'];
    let caregiver = data['Are you the primary caregiver of a dependent in your household?'];
    let WLBStory = data['How is your work life balance affected by the way you commute?'];
    let household = data['How many people are in your household?'];
    let commuteMeans = data['How do you typically travel to and from campus?']
    let caregiverStory = data['How do your family responsibilities impact your commute?'];
    let optionalComment = data['(Optional) Is there anything else you would like to share?'];
    let latlng = [data['lat'], data['lng']];
    // TODO: Calculate distance from UCLA here
    // TODO: add more details as needed 
    let userResponse = {
        "zipcode": userZipcode,
        "commuteMeans": commuteMeans,
        "caregiver": caregiver,
        "household": household,
        "WLBStory": WLBStory,
        "caregiverStory": caregiverStory,
        "experience": userExperience,
        "optionalComment" : optionalComment,
        "latlng" : latlng,
    };
    return userResponse;
}


/**
 * gets Boundary mapping given map URL (map) zipcode
 * @param {*} mapPath, URL path to map
 * @param {*} allResponses, Array contains all user responses 
 */
function getBoundary(mapPath, allResponses) {
    fetch(mapPath)
        .then(response => {
            return response.json();
        })
        .then(data => {
            // create a customized geojson that only includes areas with responses
            // add more if needed
            let allResponsesGeoJson = {
                "type": "FeatureCollection",
                "features" : []
            }
            data.features.forEach(feature => {
                let addFeature = false
                let customizedFeature = {
                    "type": "Feature",
                    "properties": {
                        "zcta": feature.properties.zcta, 
                        "latitude": feature.properties.latitude, 
                        "longitude": feature.properties.longitude,
                        "positiveResponses" : [],
                        "negativeResponses" : [],
                        "neutralResponses" : [],
                        "caregiverResponses" : [],
                        "nonCaregiverResponses" : [],
                    },
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": feature.geometry.coordinates
                    },
                }
                allResponses.forEach(response => {
                    if (response.zipcode == feature.properties.zcta) {
                        if (response.experience.includes("Negative")) {
                            if (response.caregiver == "Yes") {
                                responseCount["careNegCount"]++;
                            }
                            else {
                                responseCount["nonNegCount"]++;
                            }
                        }
                        else if (response.experience.includes("Positive")) {
                            if (response.caregiver == "Yes") {
                                responseCount["carePosCount"]++;
                            }
                            else {
                                responseCount["nonPosCount"]++;
                            }
                        }
                        else if (response.experience.includes("Neutral")) {
                            if (response.caregiver == "Yes") {
                                responseCount["careNeuCount"]++;
                            }
                            else {
                                responseCount["nonNeuCount"]++;
                            }
                        }

                        addFeature = true
                        // add positive/negative/neutral response to geojson
                        if(response.experience.includes("Positive")) {
                            customizedFeature.properties.positiveResponses.push(response);
                        }
                        else if (response.experience.includes("Negative")) {
                            customizedFeature.properties.negativeResponses.push(response);
                        }
                        else if(response.experience.includes("Neutral")) {
                            customizedFeature.properties.neutralResponses.push(response);
                        }
                        // append current feature to geojson
                        if(response.caregiver == "Yes") {
                            customizedFeature.properties.caregiverResponses.push(response);
                        }
                        else if (response.caregiver == "No") {
                            customizedFeature.properties.nonCaregiverResponses.push(response);
                        }
                    }
                })
                if(addFeature)
                    allResponsesGeoJson.features.push(customizedFeature)
            })
            
            carePositiveLayer = L.geoJSON(allResponsesGeoJson, {
                style: getStyle,
                onEachFeature: onEachFeature,
                filter: function (feature, layer){
                    return (feature.properties.caregiverResponses.length > 0 && feature.properties.positiveResponses.length > 0)
                }
            }).addTo(map)

            careNegativeLayer = L.geoJSON(allResponsesGeoJson, {
                style: getStyle,
                onEachFeature: onEachFeature,
                filter: function (feature, layer){
                    return (feature.properties.caregiverResponses.length > 0 && feature.properties.negativeResponses.length > 0)
                }
            }).addTo(map)
            
            careNeutralLayer = L.geoJSON(allResponsesGeoJson, {
                style: getStyle,
                onEachFeature: onEachFeature,
                filter: function (feature, layer){
                    return (feature.properties.caregiverResponses.length > 0 && feature.properties.neutralResponses.length > 0)
                }
            }).addTo(map)

            noncarePositiveLayer = L.geoJSON(allResponsesGeoJson, {
                style: getStyle,
                onEachFeature: onEachFeature,
                filter: function (feature, layer){
                    return (feature.properties.nonCaregiverResponses.length > 0 && feature.properties.positiveResponses.length > 0)
                }
            }).addTo(map)

            noncareNegativeLayer = L.geoJSON(allResponsesGeoJson, {
                style: getStyle,
                onEachFeature: onEachFeature,
                filter: function (feature, layer){
                    return (feature.properties.nonCaregiverResponses.length > 0 && feature.properties.negativeResponses.length > 0)
                }
            }).addTo(map)

            noncareNeutralLayer = L.geoJSON(allResponsesGeoJson, {
                style: getStyle,
                onEachFeature: onEachFeature,
                filter: function (feature, layer){
                    return (feature.properties.nonCaregiverResponses.length > 0 && feature.properties.neutralResponses.length > 0)
                }
            }).addTo(map)
            
        })
        .then(_ => {
            moveProgress();
        })
}

/**
 * Helper, filters responses by mathcing zipcode
 * @param {*} currentZipcode zipcode which you want to highlight
 * @returns returns responses filtered for matching zipcode
 */
function getStyle(feature) {
    let score = getScoreForRegion(feature);
        return {
            fillColor: getColorFromScore(score),
            weight: 0,
            color: '#666',
            dashArray: '',
            fillOpacity: 1,
        }
}

function getScoreForRegion(feature) {
    let plusScore = feature.properties.positiveResponses.length;
    let minusScore = feature.properties.negativeResponses.length;
    let neutralScore = feature.properties.neutralResponses.length;
    return (plusScore - minusScore) / (plusScore + minusScore + neutralScore);
}

// TODO: May need to come up with new color gradient
// TODO: Change the colors as you like at https://colorbrewer2.org/#type=sequential&scheme=BuGn&n=3 (Ctrl + Click)
function getColorFromScore(score) {
    if (score >= 0.33) {
        return "#9FF25D"; // green
    }
    else if (score >= -0.33) {
        return "#F2DA5D"; //yellow
    }
    else {
        return "#F25D5D"; //red
    }
}

function onEachFeature(feature, layer) {
    layer.on({
        click: populateSidebar
    });
}

function populateTable(allResponses) {
    let table = document.getElementById("responseTable");

    let rowNum = 1;
    allResponses.forEach(response => {
        let row = table.insertRow(rowNum);

        let zipcodeCell = row.insertCell(0);
        let caregiverCell = row.insertCell(1);
        let commuteModeCell = row.insertCell(2);
        let experienceCell = row.insertCell(3);
        let workLifeCell = row.insertCell(4);
        let familyCell = row.insertCell(5);
        let addtlCell = row.insertCell(6);

        zipcodeCell.innerHTML = response["zipcode"];
        caregiverCell.innerHTML = response["caregiver"];
        commuteModeCell.innerHTML = response["commuteMeans"];
        experienceCell.innerHTML = response["experience"];
        workLifeCell.innerHTML = response["WLBStory"];
        familyCell.innerHTML = response["caregiverStory"];
        addtlCell.innerHTML = response["optionalComment"];
    })
    
}

function showDataTable() {
    let DATA_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRCF24Aalv8tZ3neF_4LZQ21KLokn5jtZgpc9-wiAuDhT1_LXNYtxKRtsM-eo0UAzhGUHqQvJCgCNmI/pub?output=csv";
    Papa.parse(DATA_URL, {
        header: true,
        download: true,
        complete: results => {
            data = results.data;

            let allResponses = [];
            data.forEach(column => {
                    let userResponse = getUserResponseData(column)
                    allResponses.push(userResponse)
                });
            populateTable(allResponses);
        }
    })
    document.getElementById("storyTableDiv").setAttribute("style", "display:block");
}

function populateSidebar(e) {
    let layer = e.target
    let careStories = document.getElementById("careBubble");
    let noncareStories = document.getElementById("noncareBubble");
    
    let displayingResponses = []
    if (displayPositiveResponses) {
        displayingResponses = displayingResponses.concat(layer.feature.properties.positiveResponses);
    }
    if (displayNegativeResponses) {
        displayingResponses = displayingResponses.concat(layer.feature.properties.negativeResponses);
    }
    if (displayNeutralResponses) {
        displayingResponses = displayingResponses.concat(layer.feature.properties.neutralResponses);
    }

    // filter responses by caregiver  
    displayingResponses = displayingResponses.filter(function (response) {
        if (response.caregiver == "Yes") {
            generateSidebarResponses(careStories, displayingResponses);
            document.getElementById("careStories").setAttribute("style","display:block");
        }
        else {
            document.getElementById("careStories").setAttribute("style","display:hidden");
        }
    
        if (response.caregiver == "No") {
            generateSidebarResponses(noncareStories, displayingResponses);
            document.getElementById("noncareStories").setAttribute("style","display:block");
        }
        else {
            document.getElementById("noncareStories").setAttribute("style","display:hidden");
        }

        if (!displayCaregiver && response.caregiver == "Yes") {
            return false;
        }
        else if (!displayNonCaregiver && response.caregiver == "No") {
          return false; 
        }
        else {
          return true; 
        }
      });
}

function generateSidebarResponses(stories, responses) {
    let style = "";
    stories.innerHTML = "";
    let zipLatLng = [];
    responses.forEach(response => {
        zipLatLng = response.latlng;
        stories.innerHTML += 
        `<p ${style}> 
        <img src='assets/zipcode.png' class="icon"> ${response.zipcode} <br>
        <img src='assets/car.png' class="icon"> ${response.commuteMeans} <br> 
        <img src='assets/carriage.png' class="icon"> Caregiver: ${response.caregiver} <br> 
        <img src='assets/household.png' class="icon"> Household: ${response.household} <br> <br>
        <b>How is your work life balance affected by the way you commute?</b> <br> ${response.WLBStory} <br><br>` 
        + ((response.caregiver == "Yes")? `<b> How do your family responsibilities impact your commute?</b> <br> ${response.caregiverStory} <br><br>`: ``)
        + ((response.optionalComment.length > 0)? `<b>Is there anything else you would like to share?</b> <br> ${response.optionalComment} )` : ``)
        + `</p>` 
    })
    console.log(zipLatLng[0]);
    map.panTo(new L.LatLng(zipLatLng[0], zipLatLng[1]));
}
// Add info for mouse hovering 
let info = L.control({position : "bottomleft"});
info.onAdd = function () {
    this._div = L.DomUtil.create('div', 'info'); 
    this.update();
    return this._div;
};

function getDistanceToUCLA(latlng) {
    let UCLAlatlng = L.latLng([34.0709, -118.444])
    let currentLatlng = L.latLng(latlng)
    let distance = UCLAlatlng.distanceTo(currentLatlng) / 1609.344 //convert meter to miles
    distance = distance.toFixed(2)
    return distance
}

// EXECUTE THIS CODE
loadData(DATA_URL);

// add UCLA marker with custom design
var uclaIcon = L.icon({
    iconUrl: 'assets/ucla.png', // will be replaced by custom icon
    iconSize: [40, 40],
    iconAnchor: [18, 36],
  });
  
  // Create the UCLA marker
  var marker = L.marker([34.0709, -118.444], { icon: uclaIcon }).addTo(map);

function moveProgress() {
    let totalCaregiverCount = responseCount["carePosCount"] + responseCount["careNegCount"] + responseCount["careNeuCount"]
    let carePosRatio = (responseCount["carePosCount"] / totalCaregiverCount) * 100
    let careNegRatio = (responseCount["careNegCount"] / totalCaregiverCount) * 100
    let careNeuRatio = (responseCount["careNeuCount"] / totalCaregiverCount) * 100

    let totalNoncaregiverCount = responseCount["nonPosCount"] + responseCount["nonNegCount"] + responseCount["nonNeuCount"]
    let nonPosRatio = (responseCount["nonPosCount"] / totalNoncaregiverCount) * 100
    let nonNegRatio = (responseCount["nonNegCount"] / totalNoncaregiverCount) * 100
    let nonNeuRatio = (responseCount["nonNeuCount"] / totalNoncaregiverCount) * 100

    document.getElementById("posCareProgress").setAttribute("style","width:" + carePosRatio + "%");
    document.getElementById("negCareProgress").setAttribute("style","width:" + careNegRatio + "%");
    document.getElementById("neuCareProgress").setAttribute("style","width:" + careNeuRatio + "%");

    document.getElementById("posNonProgress").setAttribute("style","width:" + nonPosRatio + "%");
    document.getElementById("negNonProgress").setAttribute("style","width:" + nonNegRatio + "%");
    document.getElementById("neuNonProgress").setAttribute("style","width:" + nonNeuRatio + "%");
}

// project intro modal popup on load
let modal = document.getElementById("myModal");
let spans = document.getElementsByClassName("close"); //span element that closes the modal
//open the modal on load
window.onload = (event) =>  { 
  modal.style.display = "block";
};
//close the modal when click x
spans[0].onclick = function() {
    modal.style.display = "none";
}

showAllButton = document.getElementById("showAllButton");
showAllButton.onclick = function() {
    modal.style.display = "none";
}
//clicks anywhere outside close modal
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
} 

// caregiver/noncaregiver info popup module
let careInfoPop = document.getElementById("carePop");
let noncareInfoPop = document.getElementById("noncarePop");

function closePopup(element) {
    let popupBox = document.getElementById(element);
    popupBox.setAttribute("style","display:none");
}

function openPopup(element) {
    let popupBox = document.getElementById(element);
    popupBox.setAttribute("style","display:block");
}

document.getElementById("clickableCare").addEventListener("click", function(e) {
    if (map.hasLayer(careNegativeLayer) 
        && map.hasLayer(carePositiveLayer)
        && map.hasLayer(careNeutralLayer)) {
        map.removeLayer(careNegativeLayer);
        map.removeLayer(carePositiveLayer);
        map.removeLayer(careNeutralLayer);
        document.getElementById("clickableCare").setAttribute("style","background-color:#ccc");

        
    }
    else {
        map.addLayer(careNegativeLayer);
        map.addLayer(carePositiveLayer);
        map.addLayer(careNeutralLayer);
        document.getElementById("clickableCare").setAttribute("style","background-color:#F7F6F3");

    }
    console.log("Caregiver clicked!")
});

document.getElementById("clickableNonCare").addEventListener("click", function(e) {
    if (map.hasLayer(noncareNegativeLayer) 
        && map.hasLayer(noncarePositiveLayer)
        && map.hasLayer(noncareNeutralLayer)) {
        map.removeLayer(noncareNegativeLayer);
        map.removeLayer(noncarePositiveLayer);
        map.removeLayer(noncareNeutralLayer);
        document.getElementById("clickableNonCare").setAttribute("style","background-color:#ccc;border-color:#7D8CC4");
    }
    else {
        map.addLayer(noncareNegativeLayer);
        map.addLayer(noncarePositiveLayer);
        map.addLayer(noncareNeutralLayer);
        document.getElementById("clickableNonCare").setAttribute("style","background-color:#F7F6F3;border-color:#7D8CC4");

    }
    console.log("Non-Caregiver clicked!")
});

document.getElementById("careButton").addEventListener("click", function(e) {
    map.removeLayer(noncareNegativeLayer);
    map.removeLayer(noncarePositiveLayer);
    map.removeLayer(noncareNeutralLayer);
    document.getElementById("clickableNonCare").setAttribute("style","background-color:#ccc;border-color:#7D8CC4");
    modal.style.display = "none";
});

document.getElementById("noncareButton").addEventListener("click", function(e) {
    map.removeLayer(careNegativeLayer);
    map.removeLayer(carePositiveLayer);
    map.removeLayer(careNeutralLayer);
    document.getElementById("clickableCare").setAttribute("style","background-color:#ccc");
    modal.style.display = "none";
});

// create popup with number of pos, neg, and neu responses when hovering over status bar
let careHoverDiv = document.getElementById("careProgress");
let noncareHoverDiv = document.getElementById("nonProgress");
let popup = document.createElement("div");
popup.setAttribute("id", "popup");

function openProgressPop(caregiver, rating) {
    if (caregiver) {
        if (rating == 'pos') {
            popup.innerHTML = `Positive Responses: ${responseCount["carePosCount"]}`;
            popup.setAttribute("style","border-color:#9FF25D");
        }
        else if (rating == 'neg') {
            popup.innerHTML = `Negative Responses: ${responseCount["careNegCount"]}`;
            popup.setAttribute("style","border-color:#F25D5D"); 
        }
        else if (rating == 'neu') {
            popup.innerHTML = `Neutral Responses: ${responseCount["careNeuCount"]}`;
            popup.setAttribute("style","border-color:#F2DA5D");
        }
        careHoverDiv.appendChild(popup);
    }
    else if (!caregiver) {
        if (rating == 'pos') {
            popup.innerHTML = `Positive Responses: ${responseCount["nonPosCount"]}`;
            popup.setAttribute("style","border-color:#9FF25D");
        }
        else if (rating == 'neg') {
            popup.innerHTML = `Negative Responses: ${responseCount["nonNegCount"]}`;
            popup.setAttribute("style","border-color:#F25D5D"); 
        }
        else if (rating == 'neu') {
            popup.innerHTML = `Neutral Responses: ${responseCount["nonNeuCount"]}`;
            popup.setAttribute("style","border-color:#F2DA5D");
        }
        noncareHoverDiv.appendChild(popup);
    }
}

function closeProgressPop() {
    if (careHoverDiv.contains(popup)) {
        careHoverDiv.removeChild(popup);
    }
    if (noncareHoverDiv.contains(popup)) {
        noncareHoverDiv.removeChild(popup);
    }
}
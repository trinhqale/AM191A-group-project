// DEFINE GLOBAL VARIABLES

let mapOptions = { 'center': [34.0709, -118.444], 'zoom': 10 };
const map = L.map('the_map').setView(mapOptions.center, mapOptions.zoom);

const MAP_PATH = "data/ca_zipcodes.geojson"
const DATA_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRCF24Aalv8tZ3neF_4LZQ21KLokn5jtZgpc9-wiAuDhT1_LXNYtxKRtsM-eo0UAzhGUHqQvJCgCNmI/pub?output=csv"

// checkboxes for user rating
const positiveResponsesLegendHtml = document.getElementById("positiveCheckbox");
const negativeResponsesLegendHtml = document.getElementById("negativeCheckbox");
const neutralResponsesLegendHtml = document.getElementById("neutralCheckbox");

//checkboxes for caregiver
const caregiverHTML = document.getElementById("caregiverCheckbox")
const nonCaregiverHTML = document.getElementById("nonCaregiverCheckbox")

// 6 Layers for displaying different results
// care = caregiver, noncare = non-caregiver
let carePositiveLayer = L.featureGroup()
let careNegativeLayer = L.featureGroup()
let careNeutralLayer = L.featureGroup()
let noncarePositiveLayer = L.featureGroup()
let noncareNegativeLayer = L.featureGroup()
let noncareNeutralLayer = L.featureGroup()

// whether to display postive/negative/neutral experience 
let displayPositiveResponses = true
let displayNegativeResponses = true
let displayNeutralResponses = true

// whether to display caregiver or non-caregiver
let displayCaregiver = true
let displayNonCaregiver = true

// change map type
let Jawg_Light = L.tileLayer('https://{s}.tile.jawg.io/jawg-light/{z}/{x}/{y}{r}.png?access-token={accessToken}', {
    attribution: '<a href="http://jawg.io" title="Tiles Courtesy of Jawg Maps" target="_blank">&copy; <b>Jawg</b>Maps</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    minZoom: 0,
    maxZoom: 22,
    subdomains: 'abcd',
    accessToken: 'FkWnkf1e22dnL71CnkeDRnZeEZRyPNd6DqNr2frT4o5zPMcnKvgfcgG2gQCNjnR7'
});
Jawg_Light.addTo(map)

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
    let allResponses = []
    console.log("Data Length: " + data.length);
    data.forEach(column => {
            console.log(column)
            let userResponse = getUserResponseData(column)
            allResponses.push(userResponse)
        });
    getBoundary(MAP_PATH, allResponses);
    // map bounds
    let latlngs = []
    allResponses.forEach(response=>{
        console.log(response.zipcode.length)
        // if zipcode is valid (aka not empty)
        if(response.zipcode.length > 0)
        {
            latlngs.push([response.latlng])
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
    return userResponse
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
            let allResponsesGeoJson= {
                "type": "FeatureCollection",
                "features" : []
            }
            data.features.forEach(feature =>{
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
                allResponses.forEach(response=>{
                    if(response.zipcode == feature.properties.zcta)
                    {
                        addFeature = true
                        // add positive/negative/neutral response to geojson
                        if(response.experience.includes("Positive"))
                        {
                            customizedFeature.properties.positiveResponses.push(response)
                        }
                        else if (response.experience.includes("Negative"))
                        {
                            customizedFeature.properties.negativeResponses.push(response)
                        }
                        else if(response.experience.includes("Neutral"))
                        {
                            customizedFeature.properties.neutralResponses.push(response)
                        }
                        // append current feature to geojson
                        if(response.caregiver == "Yes")
                        {
                            customizedFeature.properties.caregiverResponses.push(response)
                        }
                        else if (response.caregiver == "No")
                        {
                            customizedFeature.properties.nonCaregiverResponses.push(response)
                        }
                    }
                })
                if(addFeature)
                    allResponsesGeoJson.features.push(customizedFeature)
            })
            console.log(allResponsesGeoJson.features)

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
}

/**
 * Helper, filters responses by mathcing zipcode
 * @param {*} currentZipcode zipcode which you want to highlight
 * @returns returns responses filtered for matching zipcode
 */

function getStyle(feature) {
    console.log(feature)
    let score = getScoreForRegion(feature);
        return {
            fillColor: getColorFromScore(score),
            weight: 0.5,
            color: '#666',
            dashArray: '',
            fillOpacity: 0.7
        }
}


function getScoreForRegion(feature)
{
    let plusScore = feature.properties.positiveResponses.length 
    let minusScore = feature.properties.negativeResponses.length
    let neutralScore = feature.properties.neutralResponses.length
    return (plusScore - minusScore) / (plusScore + minusScore + neutralScore)
}

// TODO: May need to come up with new color gradient
// TODO: Change the colors as you like at https://colorbrewer2.org/#type=sequential&scheme=BuGn&n=3 (Ctrl + Click)
function getColorFromScore(score) {
    if(score >= 0.33)
    {
        return "#BDF7B7" // green
    }
    else if(score >= -0.33)
    {
        return "#F8F4A6" //yellow
    }
    else
    {
        return "#EE6055" //red
    }
}


function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: populateSidebar
    });
}


/**
 * Handle the highlight of the features
 * @param {*} e : event
 */
function highlightFeature(e) {
    let layer = e.target;
    layer.bringToFront();
    info.update(layer.feature.properties);
}

function resetHighlight(e) {
    info.update();
}

// TODO: make changes to sidebar here
function populateSidebar(e) {
    let layer = e.target
    let storiesHTML = document.getElementById("stories")
    let displayingResponses = []
    if(displayPositiveResponses)
    {
        displayingResponses = displayingResponses.concat(layer.feature.properties.positiveResponses)
    }
    if(displayNegativeResponses)
    {
        displayingResponses = displayingResponses.concat(layer.feature.properties.negativeResponses)
    }
    if(displayNeutralResponses)
    {
        displayingResponses = displayingResponses.concat(layer.feature.properties.neutralResponses)
    }

    // filter responses by caregiver  
    displayingResponses = displayingResponses.filter(function (response) {
        console.log("display care: ", displayCaregiver)
        console.log("current response is a caregiver: ", response.caregiver)
        if (!displayCaregiver && response.caregiver == "Yes") {
          return false; 
        }
        else if (!displayNonCaregiver && response.caregiver == "No") {
          return false; 
        } else {
          return true; 
        }
      });
    console.log(displayingResponses)

    
    // create dynamic buttons
    let buttonContainer = document.getElementById("transportModes");
    buttonContainer.innerHTML = ""
    let commuteList = [] // avoid duplicate buttons

    //Create a show all button 
    let showAllButton = document.createElement("button")
    showAllButton.textContent = "Show All"
    showAllButton.addEventListener("click", function(){
        generateSidebarResponses(storiesHTML, displayingResponses)
    })
    showAllButton.style.margin = "5px"
    buttonContainer.appendChild(showAllButton);

    // Create buttons and add onClick
    // Onclick: Get the corresponding response
    displayingResponses.forEach(response=> {
        if(commuteList.includes(response.commuteMeans))
        {
            return
        }
        commuteList.push(response.commuteMeans)
        let button = document.createElement("button");
        button.textContent = response.commuteMeans;
        button.id = "button";
        button.addEventListener("click", function () {
            console.log("Button clicked: " + response.commuteMeans);
            let filteredResponses = displayingResponses.filter(res => res.commuteMeans == response.commuteMeans)
            generateSidebarResponses(storiesHTML, filteredResponses)
        });
        buttonContainer.appendChild(button);
    });
    generateSidebarResponses(storiesHTML, displayingResponses)
}

function generateSidebarResponses(sidebarHTML, responses)
{
    let style
    sidebarHTML.innerHTML = ""
    responses.forEach(response => {
        if(response.experience.includes("Positive"))
        {
            style = `style="background-color: rgb(170, 207, 160)"`
        }
        else if(response.experience.includes("Negative"))
        {
            style = `style="background-color: rgb(240, 147, 155)"`
        }
        else if(response.experience.includes("Neutral"))
        {
            style = `style="background-color: yellow)"`
        }
        sidebarHTML.innerHTML += 
        `<div class="response" ${style}> 
        <img src='assets/home-icon.png'> ${response.zipcode} <br>
        <img src='assets/bus-icon.png'> ${response.commuteMeans} <br> 
        <img src='assets/caregiver-icon.png'> Caregiver: ${response.caregiver} <br> 
        Household: ${response.household} <br> <br>
        <b>How is your work life balance affected by the way you commute?</b> <br> ${response.WLBStory} <br><br>` 
        + ((response.caregiver == "Yes")? `<b> How do your family responsibilities impact your commute?</b> <br> ${response.caregiverStory} <br><br>`: ``)
        + ((response.optionalComment.length > 0)? `<b>Is there anything else you would like to share?</b> <br> ${response.optionalComment} )` : ``)
        + `</div>` 
    })
}
// Add info for mouse hovering 
let info = L.control({position : "bottomleft"});
info.onAdd = function () {
    this._div = L.DomUtil.create('div', 'info'); 
    this.update();
    return this._div;
};

info.update = function (props) {
    if(props)
    {
    let positiveCount = props.positiveResponses.length
    let negativeCount = props.negativeResponses.length
    let neutralCount = props.neutralResponses.length
    let totalCount = positiveCount + negativeCount + neutralCount
    let latlng = [props.latitude, props.longitude]
    let distanceToUCLA = getDistanceToUCLA(latlng)
    this._div.innerHTML = 
        '<header>Zipcode: ' + props.zcta + '</header>' 
        'Total Responses: ' + totalCount + '<br>'
        + 'Distance to UCLA:<br>' 
        + distanceToUCLA + ' miles' + '<br>'
    }
    else
    {
        this._div.innerHTML = `Hover over a region to see <br>a summary of the zipcode!`;
        
    }
};

info.addTo(map);

function getDistanceToUCLA(latlng)
{
    let UCLAlatlng = L.latLng([34.0709, -118.444])
    let currentLatlng = L.latLng(latlng)
    let distance = UCLAlatlng.distanceTo(currentLatlng) / 1609.344
    distance = distance.toFixed(2)
    return distance
}

// add legend

let legend = L.control({position: 'bottomleft'});

legend.onAdd = function () {
    let div = L.DomUtil.create('div', 'info legend');
    let grades = [0.33,-0.33,-1]; // change here
    let labels = ["Positive", "Neutral", "Negative"]
    div.innerHTML = 'Overall Work-Life<br>Balance by zipcode<br>' 
    for (let i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<i style="background:' 
            + getColorFromScore(grades[i])
            + '"></i> '  
            + (labels[i]) + '<br>';
    }
    return div;
};
//legend.addTo(map);


// EXECUTE THIS CODE
loadData(DATA_URL)

// Toggle Layers
positiveResponsesLegendHtml.addEventListener("change", togglePositiveLayer) 

function togglePositiveLayer(){
    if(positiveResponsesLegendHtml.checked){
        if (displayCaregiver)
        {
            map.addLayer(carePositiveLayer)
        }
        if(displayNonCaregiver)
        {
            map.addLayer(noncarePositiveLayer)
        }
        displayPositiveResponses = true
    }
    else{
        map.removeLayer(carePositiveLayer)
        map.removeLayer(noncarePositiveLayer)
        displayPositiveResponses = false
    }
}

negativeResponsesLegendHtml.addEventListener("change", toggleNegativeLayer) 

function toggleNegativeLayer(){
    if(negativeResponsesLegendHtml.checked){
        if (displayCaregiver)
        {
            map.addLayer(careNegativeLayer)
        }
        if(displayNonCaregiver)
        {
            map.addLayer(noncareNegativeLayer)
        }
        displayNegativeResponses = true
    }
    else{
        map.removeLayer(careNegativeLayer)
        map.removeLayer(noncareNegativeLayer)
        displayNegativeResponses = false
    }
}

neutralResponsesLegendHtml.addEventListener("change", toggleNeutralLayer) 

function toggleNeutralLayer(){
    if(neutralResponsesLegendHtml.checked){
        if (displayCaregiver)
        {
            map.addLayer(careNeutralLayer)
        }
        if(displayNonCaregiver)
        {
            map.addLayer(noncareNeutralLayer)
        }
        displayNeutralResponses = true
    }
    else{
        map.removeLayer(careNeutralLayer)
        map.removeLayer(noncareNeutralLayer)
        displayNeutralResponses = false
    }
}

caregiverHTML.addEventListener("change", toggleCaregiver)

function toggleCaregiver()
{   
    if(caregiverHTML.checked)
    {  
        console.log("caregiver on")
        displayCaregiver = true
        if(displayPositiveResponses)
        {
            map.addLayer(carePositiveLayer)
        }
        if(displayNegativeResponses)
        {
            map.addLayer(careNegativeLayer)
        }
        if(displayNeutralResponses)
        {
            map.addLayer(careNeutralLayer)
        }
    }
    else
    {
        console.log("caregiver off")
        displayCaregiver = false
        map.removeLayer(carePositiveLayer)
        map.removeLayer(careNegativeLayer)
        map.removeLayer(careNeutralLayer)
    }
}

nonCaregiverHTML.addEventListener("change", toggleNonCaregiver)

function toggleNonCaregiver()
{   
    if(nonCaregiverHTML.checked)
    {  
        console.log("noncaregiver on")
        displayNonCaregiver = true
        if(displayPositiveResponses)
        {
            map.addLayer(noncarePositiveLayer)
        }
        if(displayNegativeResponses)
        {
            map.addLayer(noncareNegativeLayer)
        }
        if(displayNeutralResponses)
        {
            map.addLayer(noncareNeutralLayer)
        }
    }
    else
    {
        console.log("noncaregiver off")
        displayNonCaregiver = false
        map.removeLayer(noncarePositiveLayer)
        map.removeLayer(noncareNegativeLayer)
        map.removeLayer(noncareNeutralLayer)
    }
}

// TODO: add UCLA marker with custom design
var uclaIcon = L.icon({
    iconUrl: 'assets/ucla-pin.png', // will be replaced by custom icon
    iconSize: [100, 100],
    iconAnchor: [18, 36],
  });
  
  // Create the UCLA marker
  var marker = L.marker([34.0709, -118.444], { icon: uclaIcon }).addTo(map);
  
  // Make the icon a circle using CSS properties
  marker.on('add', function () {
    var iconElement = marker.getElement();
    if (iconElement) {
      iconElement.style.borderRadius = '50%';
      iconElement.style.width = '36px';
      iconElement.style.height = '36px';
    }
  });
  
  map.on('zoomend', function () {
    var currentZoom = map.getZoom();
    var updatedIconSize = [36, 36]; // Determine the size of the icon with zoom level
  
    // Adjust the icon size based on the current zoom level
    if (currentZoom >= 10 && currentZoom < 15) {
      updatedIconSize = [40, 40];
    } else if (currentZoom >= 15 && currentZoom < 20) {
      updatedIconSize = [50, 50];
    } else if (currentZoom >= 20) {
      updatedIconSize = [60, 60];
    }
  
    // Update the icon size of the marker
    uclaIcon.options.iconSize = updatedIconSize;
    marker.setIcon(uclaIcon);
  });
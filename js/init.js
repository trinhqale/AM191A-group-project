let mapOptions = { 'center': [34.0709, -118.444], 'zoom': 10 }
const map = L.map('the_map').setView(mapOptions.center, mapOptions.zoom);

let mapPath = "data/ca_zipcodes.geojson"

let positiveResponses = []
let negativeResponses = []
let neutralResponses = []

let caregiverResponses = []
let noncaregiverResponses = []

let chosenResponses = []

let currentLayer

const dataUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRCF24Aalv8tZ3neF_4LZQ21KLokn5jtZgpc9-wiAuDhT1_LXNYtxKRtsM-eo0UAzhGUHqQvJCgCNmI/pub?output=csv"

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
        complete: results => processData(results)
    })
}

function processData(results) {
    chosenResponses = []
    console.log(results)
    results.data.forEach(data => {
            console.log(data)
            filterResponseData(data)
        })
    
        // TODO: add filter checkbox/buttons and get proper responses 
    chosenResponses = positiveResponses.concat(negativeResponses, neutralResponses)
    getBoundary(mapPath, chosenResponses)
}

function filterResponseData(data) {
    let userZipcode = data['What is the zip code of your primary home?']
    let userExperience = data['Overall, what would you rate your work life balance?']
    let caregiver = data['Are you the primary caregiver of a dependent in your household?']
        // TODO: add more details as needed 
    let userResponse = {
        "zipcode": userZipcode,
        "commuteMeans": data['How do you typically travel to and from campus?'],
        "caregiver": caregiver,
        "household": data['How many people are in your household?'],
        "WLBStory": data['How is your work life balance affected by the way you commute?'],
    }
    if (userExperience.includes("Positive")) {
        console.log("positive")
        positiveResponses.push(userResponse)
    } else if (userExperience.includes("Negative")) {
        console.log("negative")
        negativeResponses.push(userResponse)
    } else if (userExperience.includes("Neutral")) {
        console.log("neutral")
        neutralResponses.push(userResponse)
    }

    // TODO: Caregiver responses
}

// mapping by zipcode
function getBoundary(mapPath, chosenResponses) {
    fetch(mapPath)
        .then(response => {
            return response.json();
        })
        .then(data => {
            function getStyle(currentZipcode) {
                let count = getResponseNumber(currentZipcode);
                if (count > 0)
                {
                    return{
                        fillColor: getColor(count),
                        weight: 1,
                        color: '#666',
                        dashArray: '',
                        fillOpacity: 0.7
                    } 
                }
                else{
                    return {
                        fillColor: "#efefef",
                        opacity: 0
                    }
                }
            }

            function style(feature) {
                return getStyle(feature.properties.zcta)
            }
            currentLayer = L.geoJSON(data, {
                style: style,
                onEachFeature: onEachFeatureClosure(chosenResponses)
            }).addTo(map)
        })
}

function getResponseNumber(currentZipcode){
    let count = 0
    for (let i = 0; i < chosenResponses.length; i++) {
        if (chosenResponses[i].zipcode == currentZipcode) {
            count++;
        }
    }
    return count
}

// TODO: Change the scale as we get more responses
// TODO: Change the colors as you like at https://colorbrewer2.org/#type=sequential&scheme=BuGn&n=3 (Ctrl + Click)
function getColor(d) {
    // return d >= 5 ? '#b30000' :
    //        d >= 4 ? '#e34a33' :
    //        d >= 3 ? '#fc8d59' :
    //        d >= 2 ? '#fdbb84' :
    //        d >= 1 ? '#fdd49e' :
    //                 '#fef0d9' ;
    return d >= 2 ?  '#e34a33':
           d >= 1 ? '#fdbb84' :
           null
}

function onEachFeatureClosure(chosenResponses) {
    return function onEachFeature(feature, layer) {
        let responsesByZipcode = []
        chosenResponses.forEach(response => {
            if (response.zipcode == feature.properties.zcta) {
                responsesByZipcode.push(response)
            }
        })
        layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight,
            click: populateSidebar(responsesByZipcode)
        });
    }
}

function highlightFeature(e) {
    var layer = e.target;
    layer.bringToFront();
    info.update(layer.feature.properties);
}

function resetHighlight(e) {
    currentLayer.resetStyle(e.target);
    info.update();
}

// TODO: make changes to sidebar here
function populateSidebar(responsesByZipcode) {
    return function onRegionClick(e) {
        let layer = e.target
        if(responsesByZipcode.length != 0)
        {
            map.fitBounds(layer.getBounds());
            document.getElementById("stories").innerHTML = ""
            console.log(responsesByZipcode)

            // add if statement to sort through caregiver vs not to include caregiver question
            responsesByZipcode.forEach(response => {
                document.getElementById("stories").innerHTML += 
                `<div class="response"> 
                    <img src='assets/home-icon.png'> ${response.zipcode} <br>
                    <img src='assets/bus-icon.png'> ${response.commuteMeans} <br> 
                    <img src='assets/caregiver-icon.png'> Caregiver: ${response.caregiver} <br> 
                    Household: ${response.household} <br> <br>
                    <b>How is your work life balance affected by the way you commute?</b> <br> ${response.WLBStory} 
                </div>`
            })
        }
    }
}

loadData(dataUrl)

// Add info for mouse hovering 
var info = L.control();
info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info'); 
    this.update();
    return this._div;
};

info.update = function (props) {
    let count = 0
    if(props)
    {
        count = getResponseNumber(props.zcta)
    }
    this._div.innerHTML = 
        '<h4>Responses by Zipcode</h4>' +  ((props && count != 0) ?
        '<img src="assets/home-icon.png"> Zipcode: ' + props.zcta + '<br />' + 'Responses: ' + count
        : 'Hover over a region!');
};

info.addTo(map);

// add legend
// TODO: change the scale as we receive more responses
var legend = L.control({position: 'bottomleft'});

legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info legend'),
        grades = [1,2], // change here
        labels = [];
    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<i style="background:' + 
            getColor(grades[i] ) 
            + '"></i> '  + (grades[i]) + '<br>';
    }
    console.log("Color: ", getColor(grades[i] + 1))

    return div;
};

// TODO: add UCLA marker with custom design

// TODO: Calculate distance from UCLA
legend.addTo(map);
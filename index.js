
// marker cluster contains all the markers and clusters them.
var markerCluster;

// markers list contains all the markers, shown AND hidden.
var markers = [];

// map object
var map;

// global heatmap layer
var heatmap;

// for heatmap color
const gradient = [
  "rgba(0, 255, 255, 0)",
  "rgba(0, 255, 255, 1)",
  "rgba(0, 191, 255, 1)",
  "rgba(0, 127, 255, 1)",
  "rgba(0, 63, 255, 1)",
  "rgba(0, 0, 255, 1)",
  "rgba(0, 0, 223, 1)",
  "rgba(0, 0, 191, 1)",
  "rgba(0, 0, 159, 1)",
  "rgba(0, 0, 127, 1)",
  "rgba(63, 0, 91, 1)",
  "rgba(127, 0, 63, 1)",
  "rgba(191, 0, 31, 1)",
  "rgba(255, 0, 0, 1)",
];

// initialize with dinosaur data
var apiurl = "https://paleobiodb.org/data1.2/occs/list.csv?base_name=Dinosauria&show=full&limit=1000";

// Initialize and add the map
async function initMap(maptype) {

  const { Visualization } = await google.maps.importLibrary("visualization");
  const { Map, InfoWindow } = await google.maps.importLibrary("maps");
  const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary(
    "marker",
  );
  // Request needed libraries.

  // The map
  map = new google.maps.Map(document.getElementById("mainmap"), {
    zoom: 3,
    center: { lat: 30.60, lng: -45.82 },
    mapId: "DEMO_MAP_ID",
    mapTypeId: 'satellite',
    disableDefaultUI: true,
    maxZoom: 18,
    minZoom: 2,
    backgroundColor: 'dedede',
    // zoom: 3,
    minZoom: 3,
    restriction: {
      latLngBounds: {
        east: 179.9999,
        north: 85,
        south: -85,
        west: -179.9999
      },
      strictBounds: true
    }
  });

  console.log("Fetching data from API URL:", apiurl);
  // Load the data from the csv file.
  d3.csv(apiurl, function (data) {

    // ensure numerical data is being read as numeric
    data.forEach(function(d) {
      d.min_ma = parseFloat(d.min_ma);
      d.max_ma = parseFloat(d.max_ma);
    });

    let min_range = Math.floor(d3.min(data, d => d.min_ma));
    let max_range = Math.ceil(d3.max(data, d => d.max_ma));
    
    // set minimum and maximum values for slider based on min_ma and max_ma in data, and set values to entire interval
    document.getElementById("lower").min = min_range;
    document.getElementById("lower").max = max_range;
    document.getElementById("lower").value = min_range;

    document.getElementById("upper").min = min_range;
    document.getElementById("upper").max = max_range;
    document.getElementById("upper").value = max_range;

    document.getElementById('minrange').innerHTML = min_range + " - ";
    document.getElementById('maxrange').innerHTML = max_range + " million years ago";

    // For each row in the csv file, create a marker.
    markers = data.map((row, i) => {

      // const label = row['accepted_name'];
      // const pinGlyph = new google.maps.marker.PinElement({
      //   glyph: label,
      //   glyphColor: "white",
      // });
      
      // Get the position of the marker.
      var position = { lat: parseFloat(row['lat']), lng: parseFloat(row['lng']) };

      // Create the marker object
      const marker = new google.maps.marker.AdvancedMarkerElement({
        position,
        // content: pinGlyph.element,
      });
  
      // markers can only be keyboard focusable when they have click listeners
      marker.addListener("click", async() => {

        // show all row data to content
        var displayed_name = getAttributeFromData(row, 'accepted_name');
        // identified name is always available if accepted name is not usable
        if (displayed_name === "") {
          displayed_name = getAttributeFromData(row, 'identified_name');
        }
        var content = "<a href='https://en.wikipedia.org/wiki/" + displayed_name.split(" ")[0] + "'><h1>"+ capitalize(displayed_name) +"</h1></a>";

        content += "<p style='color: grey'>(Tip: Hover over orange text for more info!)</p>";

        content += "<p><b class='tooltip'> Time Range: <span class='tooltiptext'>Time Range is an estimate of how many millions of years ago this organism may have lived. </span></b> ";
        content += getAttributeFromData(row, 'max_ma').toString() + " million years ago - ";
        content += getAttributeFromData(row, 'min_ma').toString() + " million years ago </p>";

        content += "<p><b class='tooltip'>Diet: <span class='tooltiptext'>Diet describes the types of food that animals consume based on their primary sources of nutrition. <br> Herbivores - plant-eating <br> Carnivores - meat-eating <br> There are many other diet types, such as piscivores, which are fish-eaters. </span></b> " + capitalize(getAttributeFromData(row, 'diet')) + "</p>";
        content += "<p><b class='tooltip'>Rank: <span class='tooltiptext'>Rank is the taxonomic level this fossil was identified as. The more specific the rank, the more we know about what type of animal it was. The most specific rank is Species, followed by Genus and Family. If the rank is 'unranked clade,' it means this is a group of organisms that are descendants of a common ancestor. </span></b> " + capitalize(getAttributeFromData(row, 'accepted_rank')) + "</p>";
        content += "<p><b class='tooltip'>Motility: <span class='tooltiptext'>Motility describes the organism's ability to move around.</span></b> " + capitalize(getAttributeFromData(row, 'motility')) + "</p>";
        content += "<p><b class='tooltip'>Life Habit: <span class='tooltiptext'>Life Habit describes the organism's general lifestyle. </span></b> " + capitalize(getAttributeFromData(row, 'life_habit')) + "</p>";
        content += "<p><b class='tooltip'>Reproduction: <span class='tooltiptext'>Reproduction describes the organism's ability to reproduce.  </span></b> " + capitalize(getAttributeFromData(row, 'reproduction')) + "</p>";

        content += "<h3> Attribution </h3>"
        var ref_id = getAttributeFromData(row, 'reference_no');
        
        if (ref_id !== "") {

        await d3.csv("https://paleobiodb.org/data1.2/refs/single.csv?id=" + ref_id.toString() + "&show=both", function (data) {
          data.map((reference, i) => {
            content += "<p><b>Title: </b>" + capitalize(getAttributeFromData(reference, 'reftitle')) + "</p>";
            content += "<p><b>Published in: </b>" + getAttributeFromData(reference, 'pubyr') + "</p>";
            content += "<p><b>DOI: </b>" + getAttributeFromData(reference, 'doi') + "</p>";

            document.getElementById("info").innerHTML = content;

            document.getElementById("chatbot").style = "height: 30%; min-height: 500px; display: block";

            openPage("Details");
          });
        });
      } else {maptype
        document.getElementById("info").innerHTML = content;

        document.getElementById("chatbot").style = "display: block;";

        openPage("Details");
      }

      });

      // add data to marker, so we can use it later for filtering
      marker.data = row;

      return marker;
    });

    console.log("Creating map with visualization:", getActiveVisualization());

    if(maptype == "points"){
      if (markerCluster !== undefined) {
      markerCluster.clearMarkers();
      }
      // Add each marker to the map, one by one
      markers.forEach((marker) => {
        marker.setMap(map);
      });


    }
    else if(maptype == "clusters"){
      // Create the marker clusterer object. This groups/clusters the markers.
      markerCluster = new markerClusterer.MarkerClusterer({ markers, map });
    }
    else if(maptype == "heatmap"){
      //clear clusters 
      if (markerCluster !== undefined) {
      markerCluster.clearMarkers();
      }
      // google maps heatmap
      heatmap = new google.maps.visualization.HeatmapLayer({
        data: data.map((row, i) => { return new google.maps.LatLng(parseFloat(row['lat']), parseFloat(row['lng']))}),
        radius: 20
      });
      console.log(map instanceof google.maps.Map);
      heatmap.setMap(map);
    
      heatmap.set("gradient", heatmap.get("gradient") ? null : gradient);
    } else {
      console.log("Error - invalid map type: " + maptype);
    }
  });

}

// Update the map with subset of markers, based on slider and search query.
async function updateMap() {
  console.log("Updating map...")

  let baselink = "https://paleobiodb.org/data1.2/occs/list.csv?show=full&";
  let parameters = []

  // convert all spaces to 20% for url
  var namequery = document.getElementById("namequery").value.replace(/ /g, "%20");
  if (namequery !== "") {parameters.push("base_name=" + namequery);}
  var minrangequery = document.getElementById("minrangequery").value;
  if (minrangequery !== "") {parameters.push("min_ma=" + minrangequery);}
  var maxrangequery = document.getElementById("maxrangequery").value;
  if (maxrangequery !== "") {parameters.push("max_ma=" + maxrangequery);}
  var limitquery = document.getElementById("limitquery").value;
  if (limitquery !== "") {parameters.push("limit=" + limitquery);}

  if (parameters.length === 0) {
    console.log("No parameters entered");
    return; // no parameters, so don't update map
  }

  let active_viz = getActiveVisualization(); 
  // final link
  apiurl = baselink + parameters.join("&");

  // fetch the data. once that is done, update the map with the new data
  try {
    initMap(active_viz);
  } catch (error) {
    console.log(error);
  }

}

// Initialize and add the map
initMap("points");

// Add event listener to update button
document.getElementById("updateBtn").addEventListener("click", updateMap);

// Updates the text value under slider, each time you drag the slider handle
// var slider = document.getElementById("myRange");
// var year = document.getElementById("yearThreshold");
// year.innerHTML = slider.value;

// slider.oninput = function() {
//   year.innerHTML = this.value;
// }

// returns the id of the active visualization
function getActiveVisualization() {

  let vizbuttons = document.getElementsByClassName("vizbutton");

  // finds which radio button is checked
  for (let i = 0; i < vizbuttons.length; i++) {
    if (vizbuttons[i].checked) {
      return vizbuttons[i].id;
    }
  }
}


function openPage(evt) {

  let pageName
  let current_tab

  // evt is string if a glyph is clicked
  if (typeof evt === 'string') {
    if (evt === 'Help') {
      pageName = evt;
      current_tab = document.getElementById('help_button');
    }
    else if (evt === 'Details') {
      pageName = evt;
      current_tab = document.getElementById('details_button');
    }
    else if (evt === 'Search') {
      pageName = evt;
      current_tab = document.getElementById('search_button');
    }
    else if (evt === 'Visualization') {
      pageName = evt;
      current_tab = document.getElementById('visualization_button');
    }
    else {
      console.log("Error: invalid page");
    }

  // evt is an event if a tab is clicked
  } else {
    pageName = evt.currentTarget.innerHTML;
    current_tab = evt.currentTarget;
  }

  // Declare all variables
  var i, tabcontent, tablinks;

  // Get all elements with class="tabcontent" and hide them
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  // Get all elements with class="tablinks" and remove the class "active"
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  // Show the current tab, and add an "active" class to the button that opened the tab
  document.getElementById(pageName).style.display = "block";

  current_tab.className += " active";
}

function capitalize(string) {
  if (typeof string !== 'string') return string; 
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Get the attribute from the data
// if the data does not have the attribute, return "Attribute does not exist"
// if the resulting attribute is blank, return "Not listed"
function getAttributeFromData(data, attribute) {
    try {
      if (data[attribute] === undefined) {
        return "Attribute does not exist";
      }
      if (data[attribute] === "") {
        return "Not listed";
      }
      else {
        return data[attribute];
      }
    } catch (error) {
      return error;
    }
}

function openSubPage(evt) {

  let pageName = evt.currentTarget.innerHTML;

  // Get all elements with class="tabcontent" and hide them
  let tabcontent = document.getElementsByClassName("tabcontent");
  for (let i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  document.getElementById(pageName).style.display = "block";

}

document.getElementById("help_button").addEventListener("click", openPage);
document.getElementById("details_button").addEventListener("click", openPage);
document.getElementById("search_button").addEventListener("click", openPage);
document.getElementById("visualization_button").addEventListener("click", openPage);

document.getElementById("visualization_button").addEventListener("click", openPage);

// open tutorial page
document.getElementById("trex_button").addEventListener("click", openSubPage);
// 
document.getElementById("trex_action").addEventListener("click", function() {
  document.getElementById("namequery").value = "Tyrannosaurus rex";
  updateMap();
});

document.getElementById("Help").style.display = "block";

document.getElementById("points").addEventListener("click", function() {
  initMap("points");
});
document.getElementById("clusters").addEventListener("click", function() {
  initMap("clusters");
});
document.getElementById("heatmap").addEventListener("click", function() {
  initMap("heatmap");
});

// these are the links at the top of tutorial pages that link back to the 'Help' page
let backtohelp_buttons = document.getElementsByClassName("backtohelp")
for (let i = 0; i < backtohelp_buttons.length; i++) {
  backtohelp_buttons[i].onclick = function() {
    openPage("Help");
  };
}

// initialize empty detail window (when no data is selected)
document.getElementById("info").innerHTML = "<p>Select a data on the map point to get started!</p>  ";

var lowerSlider = document.querySelector('#lower');
var upperSlider = document.querySelector('#upper');

var lowerVal = parseInt(lowerSlider.value);
var upperVal = parseInt(upperSlider.value);

var minrange = document.getElementById("minrange");
var maxrange = document.getElementById("maxrange");

// when first loading the page, show a "loading..." message while the api call is being made
minrange.innerHTML = "Loading...";
maxrange.innerHTML = "";

upperSlider.oninput = function() {
  
  lowerVal = parseInt(lowerSlider.value);
  upperVal = parseInt(upperSlider.value);
  if (upperVal < lowerVal + 4) {
    lowerSlider.value = upperVal - 4;
    
    if (lowerVal == lowerSlider.min) {
        upperSlider.value = 4;
    }
  }

  maxrange.innerHTML = upperVal + ' million years ago';

  filterMarkers(lowerVal, upperVal);
};

lowerSlider.oninput = function() {
  
   lowerVal = parseInt(lowerSlider.value);
   upperVal = parseInt(upperSlider.value);
   if (lowerVal > upperVal - 4) {
      upperSlider.value = lowerVal + 4;
      
      if (upperVal == upperSlider.max) {
         lowerSlider.value = parseInt(upperSlider.max) - 4;
      }

   }

   minrange.innerHTML = lowerVal + ' - ';

   filterMarkers(lowerVal, upperVal);
};

function filterMarkers(minrange, maxrange){
  var visible_markers = [];
  var visible_markers_rows = [];

  for (var i = 0; i < markers.length; i++) {
    // in order for the fossil to show up, its time range must OVERLAP with the time range selected by the user
    // meaning, EITHER the max_ma is below maxrange AND above minrange, OR the min_ma is above minrange AND below maxrange
    if (((markers[i].data['min_ma'] >= minrange) && (markers[i].data['min_ma'] <= maxrange)) ||
        ((markers[i].data['max_ma'] >= minrange) && (markers[i].data['max_ma'] <= maxrange))) {
      // markers[i].map = map;
      visible_markers.push(markers[i]);
      visible_markers_rows.push(markers[i].data);
    }
    else{
      markers[i].map = null;
    }
  }

  let current_viz = getActiveVisualization();
  if (markerCluster !== undefined) {
  markerCluster.clearMarkers();
  }

  if (current_viz == "points") {
    // redraw the points
    for (var i = 0; i < visible_markers.length; i++) {
      visible_markers[i].setMap(map);
    }
  }
  else if (current_viz == "clusters") {
    // redraw the clusters
    markerCluster.addMarkers(visible_markers);
  } else if (current_viz == "heatmap") {
    // redraw the heatmap
    heatmap.setMap(null);

    heatmap = new google.maps.visualization.HeatmapLayer({
      data: visible_markers_rows.map((row, i) => { return new google.maps.LatLng(parseFloat(row['lat']), parseFloat(row['lng']))}),
      map: map,
      radius: 20
    });
    heatmap.set("gradient", heatmap.get("gradient") ? null : gradient);
  } else {
    console.log("Error - invalid map type: " + current_viz);
  }

}


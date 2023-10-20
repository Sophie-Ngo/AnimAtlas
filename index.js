/*

To-do
- implement PBDB API, entails:
  - getting data from the PBDB API
  - customizing URLS to use to query the API 
    - query the Occurences table with occ id 
- somehow make it so that there are pretty citations (low priority--idk if it even matters really)
- find a way to offload the queried data from the API because it's really big and takes a lot of time to query every time the page loads
- keep in mind about javascript injection later down the line with custom urls (will use user input after all)
- you'll have to unit test everything eventually probably
*/

const map = await initMap();
const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
let data;
const markers = [];

// two windows 
const EMPTY_WINDOW = new google.maps.InfoWindow();
var curr_window = EMPTY_WINDOW;
var old_window = EMPTY_WINDOW;

// initialize the map
async function initMap() 
{
  const { Map } = await google.maps.importLibrary("maps");

  let new_map = new Map(document.getElementById("map"), {
    center: {lat:0,lng:0},
    zoom: 2,
    mapId: "DEMO_MAP_ID",
    mapTypeId: 'satellite',
    // mapTypeControl: false, // satellite only (do i keep?)
  });

  new_map.addListener("click", () => {

    curr_window.close();
    old_window = EMPTY_WINDOW;
    curr_window = EMPTY_WINDOW;
  });

  return new_map;
}

// get fossil occurence record
function getRecord(oid)
{
  let record = data.records.filter((obj) => {return obj.oid === oid}); // SELECT FROM data WHERE obj.oid = oid
  record = record[0]; // for some reason i need to do this in order to get to the actual record

  return record
}

// get reference record
async function getReference(record) 
{
  let ref_query = `https://paleobiodb.org/data1.2/refs/single.json?id=${record.rid}&show=both`;

  let ref = (await readJson(ref_query)).records;
  ref = ref[0];

  return ref
}

/*
Get a given attribute of a reference
@param ref - a JS object
@param attr - a string, must be a valid key in the JS object
*/
function getAttributeFromRef(ref, attr)
{
  if (typeof ref === 'undefined'){
    return 'ref is undefined.';
  }

  let value = ref[attr]

  if (typeof value === 'undefined')
  {
    return ('This reference has no ' + attr + ' listed.');
  }

  return value;
}

// create one marker on the map representing an individual fossil
// @param oid - occurence id (primary key in PaleoBioDB) - identifies which fossil to put on the map
async function createMarker(oid) 
{
  let record = getRecord(oid);
  let ref = await getReference(record);

  const content_string =
  '<div id="content">' +
    '<div id="siteNotice">' +
    "</div>" +
    '<h1 id="firstHeading" class="firstHeading">' +
    record.tna +
    '</h1>' + 
    '<div id="bodyContent">' +
    '<p>Insert information about ' +
    record.tna +
    ' here.</p>' +
    '<p><b>Attribution:</b> DOI: ' +
    getAttributeFromRef(ref, 'doi') + 
    '<br> Title: ' +
    getAttributeFromRef(ref, 'tit') + 
    "</p></div>" +
    "</div>";
    
  const new_marker = new AdvancedMarkerElement({
    map: map,
    position: {"lng" : parseInt(record.lng), "lat" : parseInt(record.lat)},
    title: record.tna // tna = accepted name i think?
  })
  
  // when marker is clicked, it will have 2 different behaviours:
  // if a marker is clicked whose window is already open, close it and don't open another one
  // if a different marker is clicked, close the current window and open the new one
  new_marker.addListener("click", () => {
    old_window = curr_window;
    curr_window = new google.maps.InfoWindow({
      content: content_string,
      ariaLabel: record.tna,
    });

    old_window.close();

    // same marker has been clicked twice in a row, so do not open another window
    // instead, reset pointers to old and new window so we can start fresh (we no longer need to point to them)
    if (curr_window.getContent() === old_window.getContent())
    {
      old_window = EMPTY_WINDOW;
      curr_window = EMPTY_WINDOW;
    } 
    // if the same marker has not just been clicked again, open the new window 
    else
    {
      curr_window.open({
        anchor: new_marker,
        map,
      });
    }
  });

  markers.push(new_marker);
}

// fetch the json data, extract as javascript object
async function readJson(url) 
{ 
  return fetch(url).then((response) => {return response.json()});
}

// create markers from each row in the json data
async function createAllMarkers() 
{
  data = await readJson('https://paleobiodb.org/data1.2/occs/list.json?datainfo&rowcount&base_name=Dinosauria&pgm=gplates,scotese,seton&show=full&limit=50');
  let num_records = 50;
  let keys = Object.keys(data.records).slice(0,num_records);

  for (let x in keys) { 
    createMarker(data.records[x].oid);
  } 
}

// map is already initialized, now all we need to do is make all the markers!
// (map must be initialized before markers can be created)
createAllMarkers();
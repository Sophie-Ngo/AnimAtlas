let map;
let data;
const markers = [];

async function createMarker(oid, map) {
  const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
  let record = data.records.filter((obj) => {return obj.oid === oid}); // SELECT FROM data WHERE obj.oid = oid
  record = record[0]; // for some reason i need to do this in order to get to the actual record
  const new_marker = new AdvancedMarkerElement({
    map: map,
    position: {"lng" : parseInt(record.lng), "lat" : parseInt(record.lat)},
    title: record.tna // tna = accepted name i think?
  })

  markers.push(new_marker);
}

async function initMap() {
  console.log("Dinosaurs!")

  // readJson();

  const { Map } = await google.maps.importLibrary("maps");
  const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

  map = new Map(document.getElementById("map"), {
    center: {lat:0,lng:0},
    zoom: 2,
    mapId: "DEMO_MAP_ID",
    mapTypeId: 'satellite',
    mapTypeControl: false, // satellite only (do i keep?)
  });
}


// fetch the json data, extract as javascript object, save to 'data' global variable
async function readJson() { 
  data =  await fetch("./pbdb_dino_json.json").then((response) => {return response.json()});
}

async function createAllMarkers() {
  await readJson();
  let num_records = 50;
  let keys = Object.keys(data.records).slice(0,num_records);

  for (let x in keys) { 
    createMarker(data.records[x].oid, map);
    
  } 
}

await initMap();
createAllMarkers();

// /**
//  * @license
//  * Copyright 2019 Google LLC. All Rights Reserved.
//  * SPDX-License-Identifier: Apache-2.0
//  */
// // Initialize and add the map
// let map;

// async function initMap() {

//   console.log("hello")

//   const allo1 = { lng: -108.199997, lat: 43.630001  }; // 22058
//   const allo2 = { lng: -109.205833, lat: 40.423611  }; // 220162
//   const allo3 = { lng: -107.133202, lat: 34.942299  }; // 382123
//   const allo4 = { lng: -106.940559, lat: 35.320278  }; // 405146
//   const allo5 = { lng: -107.400002, lat: 38.450001  }; // 405200
//   // Request needed libraries.
//   //@ts-ignore
//   const { Map } = await google.maps.importLibrary("maps");
//   const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

//   // The map, centered at allo1
//   map = new Map(document.getElementById("map"), {
//     zoom: 4,
//     center: allo1,
//     mapId: "DEMO_MAP_ID",
//   });

//   // The marker, positioned at allo1 (with occurence no. 220058)
//   const marker1 = new AdvancedMarkerElement({
//     map: map,
//     position: allo1,
//     title: "Allosaurus 220058",
//   });

//   const marker2 = new AdvancedMarkerElement({
//     map: map,
//     position: allo2,
//     title: "Allosaurus 220162",
//   });
  
//   const marker3 = new AdvancedMarkerElement({
//     map: map,
//     position: allo3,
//     title: "Allosaurus 382123",
//   });

//   const marker4 = new AdvancedMarkerElement({
//     map: map,
//     position: allo4,
//     title: "Allosaurus 405146",
//   });

//   const marker5 = new AdvancedMarkerElement({
//     map: map,
//     position: allo5,
//     title: "Allosaurus 405200",
//   });
// }

// initMap();

const API_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/sheet1?key=${API_KEY}`;
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit?usp=sharing`;
const infoWindows = [];
let openedWindow;
let map;
let markers;

function initMap() {
  // 地図の中心の緯度と経度
  const centerp = {
    lat: 34.004680232664015,
    lng: 134.59806182451828,
  };
  //
  // https://developers.google.com/maps/documentation/javascript/reference/marker
  map = new google.maps.Map(document.getElementById("map"), {
    center: centerp,
    zoom: 12,
  });

  // スプレッドシートAPIの呼び出し
  const request = new XMLHttpRequest();
  request.open("GET", API_URL, true);
  request.responseType = "json";

  request.onload = function () {
    const data = this.response;

    // jsonレスポンスをjavascriptで扱いやすい形に変換
    const markerDatas = parseData(data);

    // sidebarを追加する。
    addSidebar(markerDatas);

    // マーカーを追加する。
    markers = addMarkers(map, markerDatas);
  };
  request.send();
}

function parseData(data) {
  const colNames = data.values[0];
  data.values.shift();
  return data.values.reduce((acc, row, rowIndex) => {
    const hash = { index: rowIndex };
    row.forEach((value, colIndex) => {
      const colName = colNames[colIndex];
      hash[colName] = value;
    });
    acc.push(hash);
    return acc;
  }, []);
}

/**
 * マップにマーカーを追加します。
 * 同時にマーカーがクリックされた場合のイベントも追加します。
 * @param {google.maps.Map} map
 * @param {Array} markerDatas
 * @returns
 */
function addMarkers(map, markerDatas) {
  const markers = [];
  for (const markerData of markerDatas) {
    const lat = Number(markerData["緯度"]);
    const lng = Number(markerData["経度"]);
    if (!lat || !lng) {
      continue;
    }
    const markersLatLng = new google.maps.LatLng({
      lat: lat,
      lng: lng,
    });
    const marker = new google.maps.Marker({
      position: markersLatLng,
      map: map,
    });
    markers.push(marker);
    addClickEvent(map, marker, markerData);
  }
  return markers;
}

/**
 * サイドバーを追加します。
 * @param {Array} markerDatas
 */
function addSidebar(markerDatas) {
  let sidebar_html = "";
  for (const markerData of markerDatas) {
    const index = markerData["index"];
    const name = markerData["名称"];
    sidebar_html += `<b>${index + 1}</b> <a href="javascript:openWindow(${index})">${name}<\/a><br />`;
  }
  document.getElementById("sidebar").innerHTML =
    `<a target="_blank" href="${SHEET_URL}">元データ(Google スプレッドシート)</a><br>` + sidebar_html;
}

function addClickEvent(map, marker, markerData) {
  const contentString = `<div style="font-size:18px;font-weight:bold;margin-bottom:10px;">${markerData["名称"]}</div>`;
  // イベント発生しないとwindowが作られないので、事前に作っておく必要がある
  // https://developers.google.com/maps/documentation/javascript/infowindows
  const infoWindow = new google.maps.InfoWindow({
    content: contentString,
  });
  infoWindows.push(infoWindow);
  marker.addListener("click", () => {
    infoWindow.open({
      anchor: marker,
      map,
      shouldFocus: false,
    });
  });
}

function openWindow(i) {
  if (openedWindow) {
    openedWindow.close();
  }
  const window = infoWindows[i];
  window.open(map, markers[i]);
  openedWindow = infoWindows[i];
}

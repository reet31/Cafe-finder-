let map;
let markersLayer; 

function initMap(lat = 28.6139, lon = 77.2090, zoom = 12) { 
    if (!map) {
        map = L.map("map").setView([lat, lon], zoom);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        markersLayer = L.layerGroup().addTo(map);
    } else {
        map.setView([lat, lon], zoom);
        markersLayer.clearLayers();
    }
}

window.addEventListener("load", () => {
    initMap(); 
});

window.addEventListener("load", () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showRestaurantsByPosition, showError);
    } else {
        console.log("Geolocation not supported by this browser.");
    }
});

document.getElementById("search-button").addEventListener("click", () => {
    const location = document.getElementById("location-input").value;
    
    if (location) {
        fetchLocationCoordinates(location);
    } else {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(showRestaurantsByPosition, showError);
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    }
});

const fetchLocationCoordinates = (location) => {
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${location}`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const lat = data[0].lat;
                const lon = data[0].lon;
                showRestaurantsByPosition({ coords: { latitude: lat, longitude: lon } });
            } else {
                alert("Location not found.");
            }
        })
        .catch(error => console.error("Error:", error));
};

const showRestaurantsByPosition = (position) => {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    
    initMap(lat, lon, 14);

    L.marker([lat, lon]).addTo(markersLayer).bindPopup("You are here!");

    const overpassQuery = `[out:json];node(around:5000,${lat},${lon})[amenity=cafe];out;`;

    fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`)
        .then(response => response.json())
        .then(data => {
            const cafeList = document.getElementById("cafe-list");
            cafeList.innerHTML = "";

            if (data.elements.length > 0) {
                data.elements.forEach((cafe, index) => {
                    const listItem = document.createElement("li");
                    listItem.id = `cafe-${index}`;  

                    
                    const cafeName = document.createElement("p");
                    cafeName.textContent = cafe.tags.name || "Unnamed Cafe";
                    listItem.appendChild(cafeName);

                   
                    let imgUrl = "https://www.shutterstock.com/image-vector/street-cafe-chairs-table-terrace-600nw-1938497584.jpg";
                    if (cafe.tags.image) imgUrl = cafe.tags.image;

                    const img = document.createElement("img");
                    img.src = imgUrl;
                    img.alt = cafe.tags.name || "Cafe";
                    img.style.width = "150px";
                    img.style.borderRadius = "10px";
                    listItem.appendChild(img);

                    cafeList.appendChild(listItem);

                  
                    const marker = L.marker([cafe.lat, cafe.lon]).addTo(markersLayer);

                    const popupContent = `
                      <div style="text-align:center; font-family: Arial, sans-serif;">
                        <h3 style="margin:5px 0; color:#ff5e62;">${cafe.tags.name || "Unnamed Cafe"}</h3>
                        <img src="${imgUrl}" 
                             style="width:120px; height:auto; border-radius:10px; box-shadow:0 4px 8px rgba(0,0,0,0.2); margin-top:5px;">
                      </div>
                    `;
                    marker.bindPopup(popupContent);

                    marker.on("click", () => {
                        const target = document.getElementById(`cafe-${index}`);
                        target.scrollIntoView({ behavior: "smooth", block: "center" });
                        target.classList.add("highlight");

                        setTimeout(() => target.classList.remove("highlight"), 2000);
                    });

                  
                    listItem.addEventListener("click", () => {
                        map.setView([cafe.lat, cafe.lon], 16);  
                        marker.openPopup(); 
                    });
                });
            } else {
                cafeList.innerHTML = "<li>No cafes found nearby.</li>";
            }
        })
        .catch(error => console.error("Error:", error));
};

const showError = (error) => {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            alert("User denied the request for Geolocation.");
            break;
        case error.POSITION_UNAVAILABLE:
            alert("Location information is unavailable.");
            break;
        case error.TIMEOUT:
            alert("The request to get user location timed out.");
            break;
        case error.UNKNOWN_ERROR:
            alert("An unknown error occurred.");
            break;
    }
};




function updateTime() {
    var dt = new Date();
    document.getElementById("datetime").innerHTML = dt.toLocaleString();
}

// Initial call to display the time immediately on page load
updateTime();

// Set an interval to update the time every second (1000 milliseconds)
setInterval(updateTime, 1000);

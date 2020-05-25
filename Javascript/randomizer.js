function change_layer(current_distance, total_dist) {
    //Need the length of the path
    var degrees = Math.round((current_distance / total_dist) * 180);
    const root = document.querySelector(":root");
    let title = document.querySelector(".loader__title");
    let currentNumber = ((total_dist - current_distance) / 1000).toFixed(2)
    if (currentNumber * 1000 < 5) {
        title.innerText = "You Have Arrived!"
        degrees = Math.round(total_dist / total_dist * 180);
        root.style.setProperty("--rotation", `${degrees}deg`);
    } else {
        title.innerText = String(currentNumber) + " Km to intersection"
        root.style.setProperty("--rotation", `${degrees}deg`);
    }


}

function car_change_layer() {

    const randomNum = Math.round(Math.random() * 20);
    //const degrees = Math.round((randomNum / 20) * 180);
    let title = document.querySelector(".car_h2");
    let currentNumber = title.innerText;

    setInterval(function () {
        if (currentNumber < randomNum) {
            currentNumber++;
            title.innerText = currentNumber;
        } else if (currentNumber > randomNum) {
            currentNumber--;
            title.innerText = currentNumber;
        }
    }, 800);
}
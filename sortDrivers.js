const axios = require('axios');

let url = "https://va8ozm5wii.execute-api.ap-northeast-1.amazonaws.com/api/v1/riders";

const points = {
    "1": 25,
    "2": 20,
    "3": 15,
    "4": 13,
    "5": 11,
    "6": 10,
    "7": 9,
    "8": 8,
    "9": 7,
    "10": 6,
    "11": 5,
    "12": 4,
    "13": 3,
    "14": 2,
    "15": 1,
}

const fetchDrivers = async () => {
    try {
        const response = await axios.get(url);
        return response.data
    } catch (e) {
        if (e.response) {
            console.log(e.response.data);
            return
        }
        console.log(e);
    }
}

const efficientlySortDrivers = async (drivers) => {
    return await drivers.map(driver => {
        if (driver.previousEvent < 16) {
            driver["pointEfficiencyRate"] = points[driver.previousEvent] / driver.cost;
        } else {
            driver["pointEfficiencyRate"] = 0;
        }
        return driver
    })
    .sort((driverA, driverB) => {
        if (driverA.pointEfficiencyRate === 0 && driverB.pointEfficiencyRate === 0) {
            return (driverB.previousEvent - driverA.previousEvent)
        }
        return (driverB.pointEfficiencyRate - driverA.pointEfficiencyRate)
    })
}

const printDrivers = async (drivers) => {
    drivers.forEach( driver => {
        console.log(driver.name.padStart(20, " ") + " " + driver.pointEfficiencyRate.toString().slice(0, 4).padEnd(5, " ") + " " + driver.cost);
    })
}

const main = async () => {
    let drivers = await fetchDrivers();
    drivers = await efficientlySortDrivers(drivers);
    await printDrivers(drivers);
}

main();
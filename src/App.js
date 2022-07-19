import './App.scss';
import axios from 'axios';
import { useEffect, useState } from 'react';

let url = "https://va8ozm5wii.execute-api.ap-northeast-1.amazonaws.com/api/v1/riders";

const placePointsPair = {
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
    let totalPoints = (placePointsPair[driver.prevRace1Position] || 0) + (placePointsPair[driver.prevRace2Position] || 0) + (placePointsPair[driver.prevRace3Position] || 0);
    driver["totalPointsFromPrevEvents"] = totalPoints;
    driver["pointEfficiencyRate"] = totalPoints / driver.cost;
    return driver
  })
    .sort((driverA, driverB) => {
      if (driverA.pointEfficiencyRate === 0 && driverB.pointEfficiencyRate === 0) {
        return (driverB.previousEvent - driverA.previousEvent)
      }
      return (driverB.pointEfficiencyRate - driverA.pointEfficiencyRate)
    })
}

function App() {

  const [drivers, setDrivers] = useState([]);

  const getDrivers = async () => {
    let driversArray = await fetchDrivers();
    driversArray = await efficientlySortDrivers(driversArray);
    setDrivers(driversArray);
  }

  useEffect(() => {
    getDrivers();
  }, []);

  return (
    <div id='main'>
      <h3>Motogp Ignition</h3>
      <h4>Driver points from last 3 races</h4>
      <table>
        <tbody>
          <tr>
            <th>Place</th>
            {
              Object.entries(placePointsPair).map( (item, i) => (
                <td key={i}>{item[0]}</td>
              ))
            }
          </tr>
          <tr>
            <th>Points</th>
            {
              Object.entries(placePointsPair).map( (item, i) => (
                <td key={i}>{item[1]}</td>
              ))
            }
          </tr>
        </tbody>
      </table>
      <table>
        <thead>
          <tr>
            <th>NAME</th>
            <th>POINTS/COST</th>
            <th>COST($M)</th>
            <th>prev.ev.tot.pts</th>
          </tr>
        </thead>
        <tbody>
          {
            drivers.map(driver => (
              <tr key={driver.id}>
                <td> {driver.name} </td>
                <td> {driver.pointEfficiencyRate.toString().slice(0, 4)} </td>
                <td> {driver.cost} </td>
                <td>
                  <span className='analyticPoints'>
                    {`(${placePointsPair[driver.prevRace1Position] || "0"}+${placePointsPair[driver.prevRace2Position] || "0"}+${placePointsPair[driver.prevRace3Position] || "0"})`}
                  </span>
                  <span style={{ fontWeight: 'bold' }}>
                    ={driver.totalPointsFromPrevEvents}
                  </span>
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  );
}

export default App;

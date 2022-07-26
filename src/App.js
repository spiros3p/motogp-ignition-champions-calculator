import './App.scss';
import axios from 'axios';
import { useEffect, useState } from 'react';

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
    const response = await axios.get("https://va8ozm5wii.execute-api.ap-northeast-1.amazonaws.com/api/v1/riders");
    return response.data;
  } catch (e) {
    if (e.response) {
      console.log(e.response.data);
      return
    }
    console.log(e);
  }
}

const fetchManufacturers = async () => {
  try {
    const response = await axios.get('https://va8ozm5wii.execute-api.ap-northeast-1.amazonaws.com/api/v1/manufacturers');
    return response.data;
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

let myTeamTotalCost = 0;
// let showNotification = false;

function App() {

  const [drivers, setDrivers] = useState([]);
  const [myTeam, setMyTeam] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [showNotification, setShowNotification] = useState(false);

  const getDrivers = async () => {
    let driversArray = await fetchDrivers();
    driversArray = await efficientlySortDrivers(driversArray);
    setDrivers(driversArray);
  }

  const getManufacturers = async () => {
    let manufacturersArray = await fetchManufacturers();
    setManufacturers(manufacturersArray);
  }

  const toggleItemToMyTeam = async (item) => {
    let driversNumber = 0;
    let manufacturersNumber = 0;
    if (myTeam.includes(item)) {
      setMyTeam(myTeam.filter(teamItem => teamItem.id !== item.id))
      myTeamTotalCost -= item.cost;
    } else {
      for (let tempItem of myTeam) {
        if (Object.getOwnPropertyNames(tempItem).includes("numRiders")) {
          manufacturersNumber += 1;
        } else {
          driversNumber += 1;
        }
      }
      if ((manufacturersNumber === 1 && Object.getOwnPropertyNames(item).includes("numRiders")) || (driversNumber === 4 && Object.getOwnPropertyNames(item).includes("totalPodiums")) ) {
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 2000);
        return
      }

      if (myTeamTotalCost + item.cost > 15.01) {
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 2000);
        return
      }
      setMyTeam([...myTeam, item]);
      myTeamTotalCost += item.cost;
    }
  }

  useEffect(() => {
    getDrivers();
    getManufacturers();
  }, []);

  return (
    <div id='main'>
      <div id='notification' className={`${showNotification ? "appear" : ""}`}><span>You can NOT add it!</span></div>
      <h3>Motogp Ignition</h3>
      <h4>Driver points from last 3 races</h4>
      <table>
        <tbody>
          <tr>
            <th>Place</th>
            {
              Object.entries(placePointsPair).map((item, i) => (
                <td key={i}>{item[0]}</td>
              ))
            }
          </tr>
          <tr>
            <th>Points</th>
            {
              Object.entries(placePointsPair).map((item, i) => (
                <td key={i}>{item[1]}</td>
              ))
            }
          </tr>
        </tbody>
      </table>
      <div className='myTeam'>
        <span>
          <b>TOTAL COST: </b>
          <span id='total-cost'> {myTeamTotalCost.toFixed(2)} $</span>
        </span>
        <ul>
          {
            myTeam.map(teamItem => (
              <li key={teamItem.id} >
                <button className='btn btn-red' onClick={() => { toggleItemToMyTeam(teamItem); }}>x</button>
                <span className='itemName'>{teamItem.name}</span>
                <span className='itemCost'>{teamItem.cost} $</span>
              </li>
            ))
          }
        </ul>
      </div>
      <div className='manufacturers'>
        <div className='titles'>
          <span>NAME</span>
          <span>COST</span>
          <span>LAST POS</span>
        </div>
        <ul>
          {
            manufacturers.map(manufacturer => (
              <li key={manufacturer.id} className={`driver ${myTeam.includes(manufacturer) ? 'selected' : ''}`} onClick={() => { toggleItemToMyTeam(manufacturer); }}>
                <span>{manufacturer.name}</span>
                <span>{manufacturer.cost} $</span>
                <span>{manufacturer.previousEvent}</span>
              </li>
            ))
          }
        </ul>
      </div>
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
              <tr key={driver.id} className={`driver ${myTeam.includes(driver) ? 'selected' : ''}`} onClick={() => { toggleItemToMyTeam(driver); }}>
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

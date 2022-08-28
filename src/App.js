import './App.scss';
import axios from 'axios';
import { useEffect, useState } from 'react';

const placePointsPair = {
  "1": 25,
  "2": 20,
  "3": 16,
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

// const delay = async (millis) => {await new Promise((resolve, reject) => {setTimeout(_ => resolve(), millis)});}

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

const upgradeDriversList = async (drivers) => {
  return await drivers.map(driver => {
    let totalPoints = (placePointsPair[driver.prevRace1Position] || 0) + (placePointsPair[driver.prevRace2Position] || 0) + (placePointsPair[driver.prevRace3Position] || 0);
    driver["totalPointsFromPrevEvents"] = totalPoints;
    driver["pointEfficiencyRate"] = totalPoints / driver.cost;
    return driver
  })
}

const onSortDriversByEfficiency = async (drivers) => {
  return await drivers.sort((driverA, driverB) => {
    if (driverA.pointEfficiencyRate === 0 && driverB.pointEfficiencyRate === 0) {
      return (driverB.previousEvent - driverA.previousEvent)
    }
    return (driverB.pointEfficiencyRate - driverA.pointEfficiencyRate)
  })
}

const onSortDriversByPoints = async (drivers) => {
  return await drivers.sort((driverA, driverB) => {
    return driverB.totalPointsFromPrevEvents - driverA.totalPointsFromPrevEvents
  })
}

let myTeamTotalCost = 0;
// let showNotification = false;

function App() {
  const [drivers, setDrivers] = useState([]);
  const [myTeam, setMyTeam] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  // const [initDrivers, setInitDrivers] = useState([]);

  const getDrivers = async () => {
    let driversArray = await fetchDrivers();
    driversArray = await upgradeDriversList(driversArray);
    driversArray = await onSortDriversByEfficiency(driversArray);
    setDrivers(driversArray);
  }

  const getManufacturers = async () => {
    let manufacturersArray = await fetchManufacturers();
    manufacturersArray = await addPointsToManufacturers(manufacturersArray);
    setManufacturers(manufacturersArray);
  }

  const addPointsToManufacturers = async (manufacturersArray) => {
    manufacturersArray = await [...manufacturersArray].map(team => {
      let teamsDay1 = [];
      let teamsDay2 = [];
      let teamsDay3 = [];
      // console.log(team.name);
      for (let driver of drivers) {
        if (driver.manufacturerName === team.name) {
          teamsDay1.push(placePointsPair[driver?.prevRace1Position] || 0);
          teamsDay2.push(placePointsPair[driver?.prevRace2Position] || 0);
          teamsDay3.push(placePointsPair[driver?.prevRace3Position] || 0);
        }
      }
      teamsDay1 = teamsDay1.sort((a, b) => b - a);
      teamsDay1 = [teamsDay1[0], teamsDay1[1]];
      team["pointsDay1"] = teamsDay1;
      teamsDay2 = teamsDay2.sort((a, b) => b - a);
      teamsDay2 = [teamsDay2[0], teamsDay2[1]];
      team["pointsDay2"] = teamsDay2;
      teamsDay3 = teamsDay3.sort((a, b) => b - a);
      teamsDay3 = [teamsDay3[0], teamsDay3[1]];
      team["pointsDay3"] = teamsDay3;
      return team
    })
    return manufacturersArray;
  }

  const sortDriversByPoints = async () => {
    let newDrivers = await onSortDriversByPoints(drivers);
    setDrivers([...newDrivers]);
  }

  const sortDriversByEfficiency = async () => {
    let newDrivers = await onSortDriversByEfficiency(drivers);
    setDrivers([...newDrivers]);
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
      if ((manufacturersNumber === 1 && Object.getOwnPropertyNames(item).includes("numRiders")) || (driversNumber === 4 && Object.getOwnPropertyNames(item).includes("totalPodiums"))) {
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
    // getManufacturers();
  }, []);

  useEffect(() => {
    if (drivers.length === 0) return
    getManufacturers();
  }, [drivers]);

  const renderDriverList = drivers.map(driver => {
    return <tr key={driver.id} className={`driver ${myTeam.includes(driver) ? 'selected' : ''}`} onClick={() => { toggleItemToMyTeam(driver); }}>
      <td> {driver?.name} </td>
      <td> {driver?.manufacturerName} </td>
      <td style={{ fontWeight: 'bold' }}> {driver?.pointEfficiencyRate.toString().slice(0, 4)} </td>
      <td> {driver?.cost} </td>
      <td>
        <span className='analyticPoints'>(
          <span className='first-day-points'>{ placePointsPair[driver?.prevRace1Position] || "0" }</span>
          {`+${placePointsPair[driver?.prevRace2Position] || "0"}+${placePointsPair[driver?.prevRace3Position] || "0"})`}
        </span>
        <span style={{ fontWeight: 'bold' }}>
          ={driver?.totalPointsFromPrevEvents}
        </span>
      </td>
    </tr>
  })

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

          <span className='first-day-points'>Day1</span>
          <span>Day2</span>
          <span>Day3</span>
          <span>Tot.Pnts</span>
        </div>
        <ul>
          {
            manufacturers.map(manufacturer => (
              <li key={manufacturer.id} className={`driver ${myTeam.includes(manufacturer) ? 'selected' : ''}`} onClick={() => { toggleItemToMyTeam(manufacturer); }}>
                <span>{manufacturer.name}</span>
                <span>{manufacturer.cost} $</span>
                <span>{manufacturer.previousEvent}</span>
                <div>
                  <span style={{ fontSize: '0.8rem' }}>{`(${manufacturer.pointsDay1[0]}&${manufacturer.pointsDay1[1]})`}</span>
                  <span  className='first-day-points'>{Math.ceil((manufacturer.pointsDay1[0] + manufacturer.pointsDay1[1]) / 2)}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem' }}>{`(${manufacturer.pointsDay2[0]}&${manufacturer.pointsDay2[1]})`}</span>
                  <span style={{ fontWeight: 'bold' }}>{Math.ceil((manufacturer.pointsDay2[0] + manufacturer.pointsDay2[1]) / 2)}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem' }}>{`(${manufacturer.pointsDay3[0]}&${manufacturer.pointsDay3[1]})`}</span>
                  <span style={{ fontWeight: 'bold' }}>{Math.ceil((manufacturer.pointsDay3[0] + manufacturer.pointsDay3[1]) / 2)}</span>
                </div>
                <span style={{ fontWeight: 'bold' }}>
                  {
                    Math.ceil((manufacturer.pointsDay1[0] + manufacturer.pointsDay1[1]) / 2)
                    + Math.ceil((manufacturer.pointsDay2[0] + manufacturer.pointsDay2[1]) / 2)
                    + Math.ceil((manufacturer.pointsDay3[0] + manufacturer.pointsDay3[1]) / 2)
                  }
                </span>
              </li>
            ))
          }
        </ul>
      </div>
      <table>
        <thead>
          <tr>
            <th>NAME</th>
            <th>TEAM</th>
            <th onClick={sortDriversByEfficiency} className="selectable-title">P/C↓</th>
            <th>C($M)</th>
            <th onClick={sortDriversByPoints} className="selectable-title">prev.ev.tot.pts↓</th>
          </tr>
        </thead>
        <tbody>
          {renderDriverList}
        </tbody>
      </table>
    </div>
  );
}

export default App;

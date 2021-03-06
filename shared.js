import { renderScatterPlot, countryScatterPlot } from "./index.js";

export const states = () => {
    return {
        "AZ":"Arizona",
        "CA":"California",
        "FL":"Florida",
        "GA":"Georgia",
        "IL":"Illinois",
        "MA":"Massachusetts",
        "NC":"North Carolina",
        "NH":"New Hampshire",
        "NY":"New York",
        "OR":"Oregon",
        "SC":"South Carolina",
        "TX":"Texas",
        "WA":"Washington",
        "WI":"Wisconsin",
        "NJ":"New Jersey",
        "NV":"Nevada",
        "TN":"Tennessee",
        "CO":"Colorado",
        "DC":"District Of Columbia",
        "MI":"Michigan",
        "NE":"Nebraska",
        "OH":"Ohio",
        "VA":"Virginia",
        "MD":"Maryland",
        "PA":"Pennsylvania",
        "IN":"Indiana",
        "AK":"Alaska",
        "AR":"Arkansas",
        "DE":"Delaware",
        "IA":"Iowa",
        "KS":"Kansas",
        "KY":"Kentucky",
        "MN":"Minnesota",
        "NM":"New Mexico",
        "VT":"Vermont",
        "WV":"West Virginia",
        "RI":"Rhode Island",
        "HI":"Hawaii",
        "OK":"Oklahoma",
        "UT":"Utah",
        "ID":"Idaho",
        "MT":"Montana",
        "SD":"South Dakota",
        "ME":"Maine",
        "LA":"Louisiana",
        "MO":"Missouri",
        "MS":"Mississippi",
        "ND":"North Dakota",
        "WY":"Wyoming",
        "AL":"Alabama",
        "CT":"Connecticut",
        "PR":"Puerto Rico",
        "VI":"Virgin Islands",
        "GU":"Guam",
        "MP":"Northern Mariana Islands",
        "AS":"American Samoa"
    }
}

export const getStatesDaily = async () => {
    const response = await fetch('https://covidtracking.com/api/states/daily');
    let data = await response.json();
    data = data.sort((a, b) => (a.date > b.date) ? 1 : ((b.date > a.date) ? -1 : 0));
    return data;
}

export const renderCountrySelectOptions = (countryDaily) => {
    const selectDIV = document.getElementById('countrySelectionDiv');
    let template = '<label for="countrySelect" class="col-sm-2 col-form-label"><strong>Select country: </strong></label><select id="countrySelect" class="form-control col-sm-4 sub-div-shadow">';
    const allCountries = Object.keys(countryDaily).sort();
    for(let key in allCountries){
        template += `<option ${allCountries[key] === 'US' ? 'selected': ''} value='${allCountries[key]}'>${allCountries[key]}</option>`
    }
    template += '</select>';
    selectDIV.innerHTML = template;
    addEventCountrySelect(countryDaily);
}

export const renderSelectOptions = (stateDaily) => {
    const selectDIV = document.getElementById('stateSelectionDiv');
    let template = '<label for="stateSelect" class="col-sm-2 col-form-label"><strong>Filter by state: </strong></label><select id="stateSelect" class="form-control col-sm-4 sub-div-shadow">';
    const allStates = sortObject(states());
    for(let key in allStates){
        template += `<option ${key === 'NY' ? 'selected': ''} value='${key}'>${allStates[key]}</option>`
    }
    template += '</select>';
    selectDIV.innerHTML = template;
    renderScatterPlot(filterStateData(stateDaily, 'NY'), 'covidDailyStateCases', 'NY');
    addEventStateSelect(stateDaily);
}

export const getTotals = (data) => {
    let total = 0;
    for(let key in data){
        if(key !== 'Province/State' && key !== 'Country/Region' && key !== 'Lat' && key !== 'Long') {
            if(total < parseInt(data[key])) total = parseInt(data[key]);
        }
    }
    return total;
}

export const getLastIncrease = (data) => {
    let increase = 0;
    const keys = Object.keys(data);
    const values = Object.values(data);
    increase = values[keys.length-1] - values[keys.length-2];
    return increase;
}

export const numberWithCommas = (x) => {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const sortObject = (o) => {
    return Object.keys(o).sort().reduce((r, k) => (r[k] = o[k], r), {});
}

const addEventStateSelect = (stateDaily) => {
    const select = document.getElementById('stateSelect');
    select.addEventListener('change', () => {
        const value = select.value;
        renderScatterPlot(filterStateData(stateDaily, value), 'covidDailyStateCases', value);
    })
}

const addEventCountrySelect = (countryDaily) => {
    const select = document.getElementById('countrySelect');
    select.addEventListener('change', () => {
        const value = select.value;
        countryScatterPlot(countryDaily, 'countryScatterPlot', value);
    })
}

const filterStateData = (data, state) => {
    data = data.filter(dt => { if(dt.state === state) return dt});
    data.forEach(dt => {
        const date = dt.date;
        dt['newDate'] =`${date.toString().split('').slice(4,6).join('')}/${date.toString().split('').slice(6,8).join('')}/${date.toString().split('').slice(0,4).join('')}`
        dt['dailyPositive'] = dt.positiveIncrease;
        dt['dailyDeath'] = dt.deathIncrease;
        dt['pending'] = dt.totalTestResultsIncrease;
        dt['hospitalized'] = dt.hospitalizedIncrease;
    });
    return data;
}

export const getJHUData = async (url) => {
    const response = await fetch(url);
    const csv = await response.text();
    const data = csvJSON(csv);
    let newObj = {};
    data.forEach(obj => {
        if(newObj[obj['Country/Region']] === undefined) {
            newObj[obj['Country/Region']] = {};
            newObj[obj['Country/Region']].country = obj['Country/Region'];
            newObj[obj['Country/Region']].total = getTotals(obj);
            newObj[obj['Country/Region']].increase = getLastIncrease(obj);
        }
        else{
            newObj[obj['Country/Region']].total += getTotals(obj);
            newObj[obj['Country/Region']].increase += getLastIncrease(obj);
        }   
    });
    return newObj;
}

export const countriesDaily = async (url) => {
    const response = await fetch(url);
    const csv = await response.text();
    const data = csvJSON(csv);
    const newObj = {};
    data.forEach(obj => {
        if(newObj[obj['Country/Region']] === undefined) {
            newObj[obj['Country/Region']] = {};
            newObj[obj['Country/Region']].country = obj['Country/Region'];
            newObj[obj['Country/Region']].daily = {};
            Object.keys(obj).forEach((key, index) => {
                if(key !== 'Country/Region' && key !== 'Province/State' && key !== 'Lat' && key !== 'Long' ){
                    if(index === 4) newObj[obj['Country/Region']].daily[key] = parseInt(obj[key]);
                    else newObj[obj['Country/Region']].daily[key] = parseInt(obj[Object.keys(obj)[index]]) - parseInt(obj[Object.keys(obj)[index-1]]);
                };
            });
        }
        else {
            Object.keys(obj).forEach((key, index) => {
                if(key !== 'Country/Region' && key !== 'Province/State' && key !== 'Lat' && key !== 'Long' ){
                    if(index === 4) newObj[obj['Country/Region']].daily[key] += parseInt(obj[key]);
                    else newObj[obj['Country/Region']].daily[key] += (parseInt(obj[Object.keys(obj)[index]]) - parseInt(obj[Object.keys(obj)[index-1]]));
                };
            });
        };
    });
    return newObj;
}

export const combineJHUData = (data1, data2) => {
    let newObj = {};
    for(let country in data1){
        newObj[country] = {};
        newObj[country]['country'] = country;
        newObj[country]['confirmedTotal'] = data1[country]['total'];
        newObj[country]['confirmedIncrease'] = data1[country]['increase'];
        newObj[country]['deathTotal'] = data2[country]['total'];
        newObj[country]['deathIncrease'] = data2[country]['increase'];
    }
    return newObj;
}

const csvJSON = (csv) => {
    const lines = csv.split("\n");
    const result = [];
    const headers = lines[0].split(",");
    for(let i=1; i < lines.length; i++){
        const obj = {};
        const currentline = lines[i].split(",");
        for(let j = 0; j<headers.length; j++){
            obj[headers[j]] = currentline[j];
        }
        if(obj['Country/Region'] !== undefined) {
            result.push(obj);
        };
    }
    return result;
}
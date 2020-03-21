import { renderScatterPlot } from "./index.js";

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

export const renderSelectOptions = (stateDaily) => {
    const select = document.getElementById('stateSelect');
    let template = '';
    const allStates = sortObject(states());
    for(let key in allStates){
        template += `<option ${key === 'NY' ? 'selected': ''} value=${key}>${allStates[key]}</option>`
    }
    select.innerHTML = template;
    renderScatterPlot(filterStateData(stateDaily, 'NY'), 'covidDailyStateCases', 'NY');
    addEventStateSelect(stateDaily);
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

const filterStateData = (data, state) => {
    data = data.filter(dt => { if(dt.state === state) return dt})
    data.forEach((dt,index) => {
        const date = dt.date;
        dt['newDate'] =`${date.toString().split('').slice(4,6).join('')}/${date.toString().split('').slice(6,8).join('')}/${date.toString().split('').slice(0,4).join('')}`
        if(index !== 0){
            dt['dailyPositive'] = dt.positive - data[index-1].positive;
            dt['dailyDeath'] = dt.death - data[index-1].death;
        }
        else{
            dt['dailyPositive'] = dt.positive;
            dt['dailyDeath'] = dt.death;
        }
    });
    return data;
}
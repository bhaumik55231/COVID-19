import { getStatesDaily, renderSelectOptions, states, getTotals, numberWithCommas } from "./shared.js";

window.onload = () => {
    if('serviceWorker' in navigator){
        try {
            navigator.serviceWorker.register('./serviceWorker.js');
        }
        catch (error) {
            console.log(error);
        }
    }
    router();
}

window.onhashchange = () => {
    router();
}

const router = () => {
    const hash = decodeURIComponent(window.location.hash);
    
    if(hash === '' || hash === '#' || hash === '#source_CSSEJHU') {
        dataSourceJHU();
    }
    else if(hash === '#source_covidtracking'){
        dataSourceCovidTracking();
    }
    else window.location.hash = '#';
}

const dataSourceJHU = () => {
    document.querySelectorAll("[href='#source_CSSEJHU']")[0].classList.add('active');
    document.querySelectorAll("[href='#source_covidtracking']")[0].classList.remove('active');
    const root = document.getElementById('root');
    root.innerHTML = '';
    const div0 = document.createElement('div');
    div0.id = 'countGlobalCases';
    div0.classList = ['row sub-div-shadow custom-margin'];


    const div01 = document.createElement('div');
    div01.id = 'confirmCount';
    div01.classList = ['col-sm-6 custom-div'];
    div0.append(div01);

    const div02 = document.createElement('div');
    div02.id = 'deathCount';
    div02.classList = ['col-sm-6 custom-div'];
    div0.append(div02);

    // const div03 = document.createElement('div');
    // div03.id = 'recoveredCount';
    // div03.classList = ['col-sm-4 custom-div'];
    // div0.append(div03);

    root.append(div0);
    const div1 = document.createElement('div');
    div1.id = 'covidPositiveGlobalMap';
    div1.classList = ['row sub-div-shadow custom-margin'];
    root.append(div1);
    const div2 = document.createElement('div');
    div2.id = 'covidDeathsGlobalMap';
    div2.classList = ['row sub-div-shadow custom-margin'];
    root.append(div2);
    // const div3 = document.createElement('div');
    // div3.id = 'covidRecoveredGlobalMap';
    // div3.classList = ['row sub-div-shadow custom-margin'];
    // root.append(div3);
    // const div4 = document.createElement('div');
    // div4.id = 'covidPositiveUSAMap';
    // div4.classList = ['row sub-div-shadow custom-margin'];
    // root.append(div4);

    const div5 = document.createElement('div');
    div5.id = 'renderGlobalList';
    div5.innerHTML = `<div class="card sub-div-shadow">
                        <div class="card-header">
                            <span class="data-summary-label-wrap row">
                                <strong class="col-sm-6">Confirmed cases by country</strong> 
                                <span class="col-sm-6"><input id="filterData" class="form-control" type="text" placeholder="Min. 2 characters"><span class="fas fa-search search-icon"></span></span>
                            </span>
                        </div>
                        <div class="card-body" id="cardCountryList">
                        </div></div>`
    div5.classList = ['row custom-margin'];
    root.append(div5);

    Plotly.d3.csv('https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv', function(err, rows){
        let newObj = {};
        rows.forEach(obj => {
            if(newObj[obj['Country/Region']] === undefined) {
                newObj[obj['Country/Region']] = {};
                newObj[obj['Country/Region']].country = obj['Country/Region'];
                newObj[obj['Country/Region']].total = getTotals(obj);
            }
            else{
                newObj[obj['Country/Region']].total += getTotals(obj);
            }
        });
        renderGlobalCount(`COVID-19 confirmed cases </br><h4>${Object.values(newObj).map(dt => dt.total).reduce((a,b) => a+b)}</h4>`, 'confirmCount');
        renderGlobalMap(newObj, 'covidPositiveGlobalMap', 'confirmed cases');
        renderGlobalList(newObj, 'cardCountryList');
        addEventFilterData(newObj);
    });
    // Plotly.d3.csv('https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv', function(err, rows){
    //     renderMap(extractStates(rows.filter(dt => { if(dt['Country/Region'] === 'US') return dt})), 'positive', 'covidPositiveUSAMap', true);
    // });
    Plotly.d3.csv('https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv', (err, rows) => {
        let newObj = {};
        rows.forEach(obj => {
            if(newObj[obj['Country/Region']] === undefined) {
                newObj[obj['Country/Region']] = {};
                newObj[obj['Country/Region']].country = obj['Country/Region'];
                newObj[obj['Country/Region']].total = getTotals(obj);
            }
            else{
                newObj[obj['Country/Region']].total += getTotals(obj);
            }   
        });
        renderGlobalCount(`COVID-19 deaths </br><h4>${Object.values(newObj).map(dt => dt.total).reduce((a,b) => a+b)}</h4>`, 'deathCount');
        renderGlobalMap(newObj, 'covidDeathsGlobalMap', 'deaths');
    });
    // Plotly.d3.csv('https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Recovered.csv', (err, rows) => {
    //     let newObj = {};
    //     console.log(rows.filter(dt => {if(dt['Country/Region'] === 'US') return dt}))
    //     rows.forEach(obj => {
    //         if(newObj[obj['Country/Region']] === undefined) {
    //             newObj[obj['Country/Region']] = {};
    //             newObj[obj['Country/Region']].country = obj['Country/Region'];
    //             newObj[obj['Country/Region']].total = getTotals(obj);
    //         }
    //         else{
    //             newObj[obj['Country/Region']].total += getTotals(obj);
    //         }   
    //     });
    //     renderGlobalCount(`<h4>Global recovered </br>${Object.values(newObj).map(dt => dt.total).reduce((a,b) => a+b)}</h4>`, 'recoveredCount');
    //     renderGlobalMap(newObj, 'covidRecoveredGlobalMap', 'recovered cases');
    // });
}

const renderGlobalList = (data, id) => {
    let finalData = Object.values(data);
    finalData = finalData.sort((a, b) => (a.total < b.total) ? 1 : ((b.total < a.total) ? -1 : 0));
    let template = `<ul>`
    finalData.forEach(dt => {
        template += `<li class="row filter-countries"><div>${dt.country}</div>
                        <div class="ml-auto">
                            <div class="filter-btn" title="Confirmed cases">${numberWithCommas(dt.total)}</div>
                        </div>
                    </li>`;
    }); 
                            
    template += `</ul></div></div>`;
    document.getElementById(id).innerHTML = template;
}

const addEventFilterData = (data) => {
    data = Object.values(data);
    const search =  document.getElementById('filterData');
    search.addEventListener('keyup', e => {
        e.stopPropagation();
        const value = search.value;
        if(!value || value.trim() === '' || value.length < 2) {
            renderGlobalList(data, 'cardCountryList');
            return;
        }
        const filteredData = data.filter(dt => dt.country.toLowerCase().indexOf(value.toLowerCase()) !== -1 )
        renderGlobalList(filteredData, 'cardCountryList')
    });
}

const extractStates = (data) => {
    const array = [];
    const allStates = Object.values(states());
    const stateAcronym = Object.keys(states());
    data.forEach(obj => {
        const state = obj['Province/State'];
        if(allStates.indexOf(state) !== -1) {
            const index = allStates.indexOf(state)
            array.push({state: stateAcronym[index], positive: getTotals(obj)});
        }
    })
    return array;
}

const renderGlobalCount = (count, id) => {
    document.getElementById(id).innerHTML = numberWithCommas(count);
}

const dataSourceCovidTracking = async () => {
    document.querySelectorAll("[href='#source_CSSEJHU']")[0].classList.remove('active');
    document.querySelectorAll("[href='#source_covidtracking']")[0].classList.add('active');
    const root = document.getElementById('root');
    root.innerHTML = '';
    const div1 = document.createElement('div');
    div1.id = 'covidPositiveMap';
    div1.classList = ['row sub-div-shadow custom-margin'];
    root.append(div1);

    const div2 = document.createElement('div');
    div2.id = 'covidDeathMap';
    div2.classList = ['row sub-div-shadow custom-margin'];
    root.append(div2);

    const div3 = document.createElement('div');
    div3.id = 'covidDailyCases';
    div3.classList = ['row sub-div-shadow custom-margin'];
    root.append(div3);

    const div4 = document.createElement('div');
    div4.id = 'stateSelectionDiv';
    div4.classList = ['row custom-margin'];
    root.append(div4);

    const div5 = document.createElement('div');
    div5.id = 'covidDailyStateCases';
    div5.classList = ['row sub-div-shadow custom-margin'];
    root.append(div5);

    const data = await getStateData();
    renderMap(data, 'positive', 'covidPositiveMap');
    renderMap(data, 'death', 'covidDeathMap');
    const dailyUS = await getUSDaily();
    renderScatterPlot(dailyUS, 'covidDailyCases');
    const stateDaily = await getStatesDaily();
    renderSelectOptions(stateDaily);
}

const getStateData = async () => {
    const response = await fetch('https://covidtracking.com/api/states');
    if(response.status === 200) return await response.json();
    else return null;
}

const getUSDaily = async () => {
    const response = await fetch('https://covidtracking.com/api/us/daily');
    let data = await response.json();
    data = data.sort((a, b) => (a.date > b.date) ? 1 : ((b.date > a.date) ? -1 : 0));
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

const renderMap = (covidData, decider, id, hideUpdatedet) => {
    let data = [];
    if(hideUpdatedet){
        data = [{
            type: 'choropleth',
            locationmode: 'USA-states',
            locations: covidData.map(dt => dt.state),
            z: covidData.map(dt => dt[decider]),
            colorscale: [
                [0, 'rgb(242,240,247)'], [0.2, 'rgb(218,218,235)'],
                [0.4, 'rgb(188,189,220)'], [0.6, 'rgb(158,154,200)'],
                [0.8, 'rgb(117,107,177)'], [1, 'rgb(84,39,143)']
            ]
        }];
    }
    else{
        data = [{
            type: 'choropleth',
            locationmode: 'USA-states',
            locations: covidData.map(dt => dt.state),
            z: covidData.map(dt => dt[decider]),
            text: covidData.map(dt => `Last updated: ${dt.lastUpdateEt}`),
            colorscale: [
                [0, 'rgb(242,240,247)'], [0.2, 'rgb(218,218,235)'],
                [0.4, 'rgb(188,189,220)'], [0.6, 'rgb(158,154,200)'],
                [0.8, 'rgb(117,107,177)'], [1, 'rgb(84,39,143)']
            ]
        }];
    }

    const layout = {
        title: `COVID-19 USA ${decider === 'positive' ? 'total positive cases' : 'Total deaths' } ${numberWithCommas(covidData.map(dt => dt[decider]).reduce((a,b) => a+b))}`,
        geo:{
            scope: 'usa',
            showlakes: true,
            lakecolor: 'rgb(255,255,255)'
        },	       
        dragmode: false
    };

    Plotly.newPlot(id, data, layout, {showLink: false, responsive: true, displayModeBar: false});
}

const renderGlobalMap = (obj, id, title) => {
    const data = [{
        type: 'choropleth',
        locationmode: 'country names',
        locations: Object.values(obj).map(dt => dt['country']),
        z: Object.values(obj).map(dt => dt['total']),
        colorscale: [
            [0, 'rgb(242,240,247)'], [0.2, 'rgb(218,218,235)'],
            [0.4, 'rgb(188,189,220)'], [0.6, 'rgb(158,154,200)'],
            [0.8, 'rgb(117,107,177)'], [1, 'rgb(84,39,143)']
        ]
    }];

    const layout = {
        title: `Global ${title} ${numberWithCommas(Object.values(obj).map(dt => dt.total).reduce((a,b) => a+b))}`,
        geo: {
            projection: {
                type: 'robinson'
            }
        }
    };

    Plotly.newPlot(id, data, layout, {showLink: false, responsive: true, displayModeBar: false});
}

export const renderScatterPlot = (dailyData, id, state) => {
    const data = [
        {
            x: dailyData.map(dt => dt.newDate),
            y: dailyData.map(dt => dt.dailyDeath),
            type: 'scatter',
            name: 'Death(s)'
        },
        {
            x: dailyData.map(dt => dt.newDate),
            y: dailyData.map(dt => dt.dailyPositive),
            type: 'scatter',
            name: 'Positive Case(s)'
        }
    ];
    const layout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        title: `COVID-19 ${state ? states()[state]: 'USA'} Daily Cases ${state ? `- ${numberWithCommas(dailyData.map(dt => dt.dailyPositive).reduce((a,b) => a+b))}`: ''}`,
        xaxis: {
            fixedrange: true
        },
        yaxis: {
            title:`Counts`,
            fixedrange: true
        }
    };
    Plotly.newPlot(`${id}`, data, layout, {responsive: true, displayModeBar: false});
}
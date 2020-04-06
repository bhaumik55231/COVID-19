import { getStatesDaily, renderSelectOptions, states, getTotals, numberWithCommas, getJHUData, combineJHUData } from "./shared.js";

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
    
    if(hash === '' || hash === '#' || hash === '#source_covidtracking') {
        dataSourceCovidTracking();
    }
    else if(hash === '#source_CSSEJHU'){
        dataSourceJHU();
    }
    else window.location.hash = '#';
}

const dataSourceJHU = async () => {
    document.querySelectorAll("[href='#source_CSSEJHU']")[0].classList.add('active');
    document.querySelectorAll("[href='#source_covidtracking']")[0].classList.remove('active');
    const root = document.getElementById('root');
    root.innerHTML = '';

    const div0 = document.createElement('div');
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
                                <strong class="col-sm-6 card-heading">Confirmed cases by country</strong> 
                                <span class="col-sm-6"><input id="filterData" class="form-control" type="text" placeholder="Min. 2 characters"><span class="fas fa-search search-icon"></span></span>
                            </span>
                        </div>
                        <div class="card-body" id="cardCountryList">
                        </div></div>`
    div5.classList = ['row custom-margin'];
    root.append(div5);

    const dataConfirmed = await getJHUData('https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv');
    const dataDeaths = await getJHUData('https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv')
    renderGlobalMap(dataConfirmed, 'covidPositiveGlobalMap', 'confirmed cases');
    renderGlobalMap(dataDeaths, 'covidDeathsGlobalMap', 'deaths');
    const dataCombined = combineJHUData(dataConfirmed, dataDeaths);
    renderGlobalCount(`Confirmed cases </br><h4>${Object.values(dataCombined).map(dt => dt.confirmedTotal).reduce((a,b) => a+b)}</h4><span class="daily-increase" title="Daily increase"><i class="fas fa-arrow-up"></i> ${numberWithCommas(Object.values(dataCombined).map(dt => dt.confirmedIncrease).reduce((a,b) => a+b))}</span>`, 'confirmCount');
    renderGlobalCount(`Deaths </br><h4>${Object.values(dataCombined).map(dt => dt.deathTotal).reduce((a,b) => a+b)}</h4><span class="daily-increase" title="Daily increase"><i class="fas fa-arrow-up"></i> ${numberWithCommas(Object.values(dataCombined).map(dt => dt.deathIncrease).reduce((a,b) => a+b))}</span></br><span class="fatality-rate" title="Global case fatality rate">Global CFR - ${((Object.values(dataCombined).map(dt => dt.deathTotal).reduce((a,b) => a+b)/Object.values(dataCombined).map(dt => dt.confirmedTotal).reduce((a,b) => a+b))*100).toFixed(2)}%</span>`, 'deathCount');
    renderGlobalList(dataCombined, 'cardCountryList');
    addEventFilterData(dataCombined);
}

const renderGlobalList = (data, id) => {
    let finalData = Object.values(data);
    finalData = finalData.sort((a, b) => (a.confirmedTotal < b.confirmedTotal) ? 1 : ((b.confirmedTotal < a.confirmedTotal) ? -1 : 0));
    let template = `<ul>`
    finalData.forEach(dt => {
        template += `<li class="row filter-countries"><div class="country-name">${dt.country}</div>
                        <div class="ml-auto row">
                            <div class="col" title="Confirmed cases">${numberWithCommas(dt.confirmedTotal)}<span class="daily-increase" title="Daily increase"></br><i class="fas fa-arrow-up"></i> ${numberWithCommas(dt.confirmedIncrease)}</span></div>
                            <div class="col death-count" title="Deaths">${numberWithCommas(dt.deathTotal)}<span class="daily-increase" title="Daily increase"></br><i class="fas fa-arrow-up"></i> ${numberWithCommas(dt.deathIncrease)}</span></div>
                            <div class="col fatality-rate" title="Case fatality rate">${((dt.deathTotal/dt.confirmedTotal)*100).toFixed(2)}%</div>
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
        const value = search.value.trim();
        if(!value || value === '' || value.length < 2) {
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

    const div0 = document.createElement('div');
    div0.classList = ['row sub-div-shadow custom-margin'];

    const div01 = document.createElement('div');
    div01.id = 'confirmCountCT';
    div01.classList = ['col-sm-3 custom-div'];
    div0.append(div01);

    const div02 = document.createElement('div');
    div02.id = 'deathCountCT';
    div02.classList = ['col-sm-3 custom-div'];
    div0.append(div02);

    const div04 = document.createElement('div');
    div04.id = 'hospitalizedCountCT';
    div04.classList = ['col-sm-3 custom-div'];
    div0.append(div04);

    const div05 = document.createElement('div');
    div05.id = 'totalPendingCount';
    div05.classList = ['col-sm-3 custom-div'];
    div0.append(div05);
    root.append(div0);

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
    div5.classList = ['row sub-div-shadow custom-margin'];

    const div51 = document.createElement('div');
    div51.id = 'stateConfirmCount';
    div51.classList = ['col-sm-3 custom-div'];
    div5.append(div51);

    const div52 = document.createElement('div');
    div52.id = 'stateDeathCount';
    div52.classList = ['col-sm-3 custom-div'];
    div5.append(div52);

    const div53 = document.createElement('div');
    div53.id = 'stateHospitalizedCount';
    div53.classList = ['col-sm-3 custom-div'];
    div5.append(div53);

    const div54 = document.createElement('div');
    div54.id = 'stateTotalTestCount';
    div54.classList = ['col-sm-3 custom-div'];
    div5.append(div54);
    root.append(div5);

    const div6 = document.createElement('div');
    div6.id = 'covidDailyStateCases';
    div6.classList = ['row sub-div-shadow custom-margin'];
    root.append(div6);

    const usCurrent = await getUSCurrent();
    const data = await getStateData();
    renderMap(data, 'positive', 'covidPositiveMap');
    renderMap(data, 'death', 'covidDeathMap');
    const dailyUS = await getUSDaily();
    renderScatterPlot(dailyUS, 'covidDailyCases');
    const stateDaily = await getStatesDaily();
    renderSelectOptions(stateDaily);
    renderGlobalCount(`Confirmed cases </br><h4>${usCurrent[0].positive}</h4><span class="daily-increase" title="Daily increase"><i class="fas fa-arrow-up"></i> ${numberWithCommas(dailyUS[dailyUS.length-1].positiveIncrease)}</span>`, 'confirmCountCT');
    renderGlobalCount(`Deaths </br><h4>${usCurrent[0].death}</h4><span class="daily-increase" title="Daily increase"><i class="fas fa-arrow-up"></i> ${numberWithCommas(dailyUS[dailyUS.length-1].deathIncrease)}</span></br><span class="fatality-rate" title="Case fatality rate">CFR - ${((usCurrent[0].death/usCurrent[0].positive)*100).toFixed(2)}%</span>`, 'deathCountCT');
    renderGlobalCount(`Hospitalized cases </br><h4>${usCurrent[0].hospitalized}</h4><span class="daily-increase" title="Daily increase"><i class="fas fa-arrow-up"></i> ${numberWithCommas(dailyUS[dailyUS.length-1].hospitalizedIncrease)}</span>`, 'hospitalizedCountCT');
    renderGlobalCount(`Total tests </br><h4>${usCurrent[0].totalTestResults}</h4><span class="daily-increase" title="Daily increase"><i class="fas fa-arrow-up"></i> ${numberWithCommas(dailyUS[dailyUS.length-1].totalTestResultsIncrease)}</span>`, 'totalPendingCount');
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

const getUSCurrent = async () => {
    const response = await fetch('https://covidtracking.com/api/us');
    let data = await response.json();
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
        title: `USA ${decider === 'positive' ? 'confirmed cases' : 'deaths' } ${numberWithCommas(covidData.map(dt => dt[decider]).reduce((a,b) => a+b))}`,
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
        text: Object.values(obj).map(dt => dt['increase']),
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
            name: 'Deaths'
        },
        {
            x: dailyData.map(dt => dt.newDate),
            y: dailyData.map(dt => dt.dailyPositive),
            type: 'scatter',
            name: 'Positive Cases'
        },
        {
            x: dailyData.map(dt => dt.newDate),
            y: dailyData.map(dt => dt.pending),
            type: 'scatter',
            name: 'Total tests'
        },
        {
            x: dailyData.map(dt => dt.newDate),
            y: dailyData.map(dt => dt.hospitalized),
            type: 'scatter',
            name: 'Hospitalized Cases'
        }
    ];

    if(state){
        renderGlobalCount(`Confirmed cases </br><h4>${numberWithCommas(dailyData.map(dt => dt.dailyPositive).reduce((a,b) => a+b))}</h4><span class="daily-increase" title="Daily increase"><i class="fas fa-arrow-up"></i> ${numberWithCommas(dailyData[dailyData.length-1].positiveIncrease)}</span>`, 'stateConfirmCount');
        renderGlobalCount(`Deaths </br><h4>${numberWithCommas(dailyData.map(dt => dt.dailyDeath).reduce((a,b) => a+b))}</h4><span class="daily-increase" title="Daily increase"><i class="fas fa-arrow-up"></i> ${numberWithCommas(dailyData[dailyData.length-1].deathIncrease)}</span></br><span class="fatality-rate" title="Case fatality rate">CFR - ${((dailyData.map(dt => dt.dailyDeath).reduce((a,b) => a+b)/dailyData.map(dt => dt.dailyPositive).reduce((a,b) => a+b))*100).toFixed(2)}%</span>`, 'stateDeathCount');
        renderGlobalCount(`Hospitalized cases </br><h4>${numberWithCommas(dailyData.map(dt => dt.hospitalized).reduce((a,b) => a+b))}</h4><span class="daily-increase" title="Daily increase"><i class="fas fa-arrow-up"></i> ${numberWithCommas(dailyData[dailyData.length-1].hospitalizedIncrease)}</span>`, 'stateHospitalizedCount');
        renderGlobalCount(`Total tests </br><h4>${numberWithCommas(dailyData.map(dt => dt.pending).reduce((a,b) => a+b))}</h4><span class="daily-increase" title="Daily increase"><i class="fas fa-arrow-up"></i> ${numberWithCommas(dailyData[dailyData.length-1].totalTestResultsIncrease)}</span>`, 'stateTotalTestCount');
    }

    const layout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        title: `${state ? `${states()[state]}`: 'USA'}`,
        xaxis: {
            fixedrange: true,
            automargin: true,
            tickangle: 45
        },
        yaxis: {
            title:`Counts`,
            fixedrange: true
        }
    };
    Plotly.newPlot(`${id}`, data, layout, {responsive: true, displayModeBar: false});
}
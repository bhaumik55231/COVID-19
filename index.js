window.onload = () => {
    if('serviceWorker' in navigator){
        try {
            navigator.serviceWorker.register('./serviceWorker.js');
        }
        catch (error) {
            console.log(error);
        }
    }
    covid();
}

const covid = async () => {
    const data = await getStateData();
    if(data){
        renderMap(data, 'positive', 'covidPositiveMap');
        renderMap(data, 'death', 'covidDeathMap');

        const dailyUS = await getUSDaily();
        renderBarChart(dailyUS, 'covidDailyCases')
    }
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
            dt['dailyPositive'] = data[index].positive - data[index-1].positive;
            dt['dailyDeath'] = data[index].death - data[index-1].death;
        }
    });
    return data;
}

const sortObject = (o) => {
    return Object.keys(o).sort().reduce((r, k) => (r[k] = o[k], r), {});
}

const renderMap = (covidData, decider, id) => {
    const data = [{
        type: 'choropleth',
        locationmode: 'USA-states',
        locations: covidData.map(dt => dt.state),
        z: covidData.map(dt => dt[decider])
    }];


    var layout = {
        title: `COVID-19 ${decider === 'positive' ? 'Total positive cases' : 'Total deaths' } ${covidData.map(dt => dt[decider]).reduce((a,b) => a+b)}`,
        geo:{
            scope: 'usa',
            showlakes: true,
            lakecolor: 'rgb(255,255,255)'
        },	       
        dragmode: false
    };

    Plotly.newPlot(id, data, layout, {showLink: false, responsive: true, displayModeBar: false});
}

const renderBarChart = (dailyUS, id) => {
    const data = [
        {
            x: dailyUS.map(dt => dt.newDate),
            y: dailyUS.map(dt => dt.dailyDeath),
            type: 'scatter',
            name: 'Death(s)'
        },
        {
            x: dailyUS.map(dt => dt.newDate),
            y: dailyUS.map(dt => dt.dailyPositive),
            type: 'scatter',
            name: 'Positive Case(s)'
        }
    ];
    const layout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        title: 'COVID-19 Daily Cases',
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
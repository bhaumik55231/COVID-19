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

        const {positives, deaths} = await getDailyReport();
        renderBarChart(positives, deaths, 'covidDailyCases')
    }
}

const getStateData = async () => {
    const response = await fetch('https://covidtracking.com/api/states');
    if(response.status === 200) return await response.json();
    else return null;
}

const getDailyReport = async () => {
    const response = await fetch('https://covidtracking.com/api/states/daily');
    if(response.status === 200){
        let obj = {};
        let data = await response.json();
        data = data.sort((a, b) => (a.date > b.date) ? 1 : ((b.date > a.date) ? -1 : 0));
        
        data.forEach(dt => {
            const date = `${dt.date.toString().split('').slice(4,6).join('')}/${dt.date.toString().split('').slice(6,8).join('')}/${dt.date.toString().split('').slice(0,4).join('')}`
            if(obj[date] === undefined){
                obj[date] = {};
                const oldFormate = parseInt(date.split('/')[2]+date.split('/')[0]+date.split('/')[1]);
                obj[date] = data.filter(d => {if(d.date === oldFormate) return d}).map(p =>p.positive).reduce((a,b) => a+b)
            }
        });
        let objDeath = {};
        data.forEach(dt => {
            const date = `${dt.date.toString().split('').slice(4,6).join('')}/${dt.date.toString().split('').slice(6,8).join('')}/${dt.date.toString().split('').slice(0,4).join('')}`
            if(objDeath[date] === undefined){
                objDeath[date] = {};
                const oldFormate = parseInt(date.split('/')[2]+date.split('/')[0]+date.split('/')[1]);
                objDeath[date] = data.filter(d => {if(d.date === oldFormate) return d}).map(p =>p.death).reduce((a,b) => a+b)
            }
        });
        const array = Object.entries(obj);
        array.forEach((dt, i) => {
            if(i === 0) return
            if(array[i-1]){
                obj[dt[0]] = array[i][1] - array[i-1][1];
            }
        });

        const arrayDeath = Object.entries(objDeath);
        arrayDeath.forEach((dt, i) => {
            if(i === 0) return
            if(arrayDeath[i-1]){
                objDeath[dt[0]] = arrayDeath[i][1] - arrayDeath[i-1][1];
            }
        });
        return {positives: obj, deaths: objDeath};
    }
    else return null;
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
        title: `COVID-19 ${decider === 'positive' ? 'Positive Cases' : 'Deaths' } ${covidData.map(dt => dt[decider]).reduce((a,b) => a+b)}`,
        geo:{
            scope: 'usa',
            showlakes: true,
            lakecolor: 'rgb(255,255,255)'
        }
    };

    Plotly.newPlot(id, data, layout, {showLink: false, responsive: true, displayModeBar: false});
}

const renderBarChart = (positives, deaths, id) => {
    const data = [
        {
            x: Object.keys(deaths),
            y: Object.values(deaths),
            type: 'scatter',
            name: 'Death Count(s)'
        },
        {
            x: Object.keys(positives),
            y: Object.values(positives),
            type: 'scatter',
            name: 'Positive Case(s)'
        }
    ];
    const layout = {
        yaxis: {},
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        title: 'COVID-19 Daily Cases',
        xaxis: {
            fixedrange: true
          },
          yaxis: {
            title:`Count`,
            fixedrange: true
          }
    };
    Plotly.newPlot(`${id}`, data, layout, {responsive: true, displayModeBar: false});
}
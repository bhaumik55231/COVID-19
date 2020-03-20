window.onload = () => {
    covid();
}

const covid = async () => {
    const data = await getStateData();
    if(data){
        renderMap(data, 'positive', 'covidPositiveMap');
        renderMap(data, 'death', 'covidDeathMap');
    }
}

const getStateData = async () => {
    const response = await fetch('https://covidtracking.com/api/states');
    if(response.status === 200) return await response.json();
    else return null;
}

const renderMap = (covidData, decider, id) => {
    console.log(covidData)
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
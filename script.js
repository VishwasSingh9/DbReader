////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Function to show specific filter container
function showFilters(filterId) {
    const allFilters = document.querySelectorAll('.filter-container');
    const graphContainer = document.getElementById('graph-container');
    allFilters.forEach(filter => filter.classList.add('hidden'));
    graphContainer.innerHTML = ''; // Clear the graph container
    graphContainer.style.display = 'none';

    const selectedFilter = document.getElementById(filterId);
    if (selectedFilter) {
        selectedFilter.classList.remove('hidden');
    }

    if (filterId === 'all-reports') {
        graphContainer.style.display = 'block';
    }
    else if (filterId === 'throughput-filters') {
        graphContainer.style.display = 'block';
    }
    else if( filterId === 'fleet-filters') {
        graphContainer.style.display = 'block';
    }
    else if( filterId === 'error-filters'){
        graphContainer.style.display= "block";
    }
    else if(filterId === 'network-filters'){
        graphContainer.style.display= "block";
    }
    else if( filterId === 'task-filters'){
        graphContainer.style.display= "block";
    }
    else if(filterId === 'production-filters'){
        graphContainer.style.display= "block";
    }
    else if(filterId === 'loading-time-filters'){
        graphContainer.style.display= "block";
    }
    else if( filterId === 'task-delay-filters'){
        graphContainer.style.display= "block";
    }
    else if(filterId === 'task-cycle-filters'){
        graphContainer.style.display= "block";
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Function to handle window size and adjust the plots
window.onresize = function () {
    // console.log("Resize event triggered");
    const graphContainer = document.getElementById('graph-container');
    if (!graphContainer) {
        console.warn("Graph container not found in the DOM.");
        return;
    }

    // console.log("Graph container exists in the DOM.");

    const plotContainer = graphContainer.querySelector('.plot-container');
    if (!plotContainer) {
        // console.warn("No Plotly chart found inside the graph container.");
        return;
    }

    // console.log("Plotly chart found. Resizing...");
    Plotly.Plots.resize(graphContainer); // Attempt to resize the Plotly chart
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Throughput Plot Implementation
async function submitThroughputFilters() {
    const startDateTime = document.getElementById("throughput-start-datetime").value;
    const endDateTime = document.getElementById("throughput-end-datetime").value;
    const fileInput = document.getElementById("throughput-json-file");

    if (!fileInput.files.length) {
        alert("Please upload a .json file.");
        return;
    }

    const file = fileInput.files[0];
    const fileContent = await file.text();
    const jsonData = JSON.parse(fileContent);
    const startDate = new Date(startDateTime);
    const endDate = new Date(endDateTime);

    const filteredData = jsonData.filter(entry => {
        const entryDateTime = new Date(entry.lastModifiedDate.$date); // Entry date is in UTC +5:30hr
        return entryDateTime >= startDate && entryDateTime <= endDate;
    });

    if (filteredData.length === 0) {
        alert("No data found for the selected date and time range.");
        return;
    }

    const timestamps = filteredData.map(entry => new Date(entry.lastModifiedDate.$date));
    const throughputValues = filteredData.map(entry => entry.throughput);

    // Plot graph using Plotly
    const trace = {
        x: timestamps,
        y: throughputValues,
        type: "scatter",
        mode: "lines+markers",
        marker: { color: "green" },
        name: "Throughput"
    };

    const layout = {
        title: "Throughput Logs Over Time",
        xaxis: { title: "Timestamp" },
        yaxis: { title: "Throughput" }
    };

    Plotly.newPlot("graph-container", [trace], layout);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Start/Stop Plot Implementation
async function submitFleetFilters() {
    const startDateTime = document.getElementById("fleet-start-datetime").value;
    const endDateTime = document.getElementById("fleet-end-datetime").value;
    const fileInput = document.getElementById("fleet-json-file");

    if (!fileInput.files.length) {
        alert("Please upload a .json file.");
        return;
    }

    const file = fileInput.files[0];
    const fileContent = await file.text();
    const jsonData = JSON.parse(fileContent);
    const startDate = new Date(startDateTime);
    const endDate = new Date(endDateTime);

    const filteredData = jsonData.filter(entry => {
        const entryDateTime = new Date(entry.lastModifiedDate.$date);
        return entryDateTime >= startDate && entryDateTime <= endDate;
    });
    const errorFilteredData = filteredData.filter(entry => entry.errorCode === 0 || entry.errorCode === 1);

    if (errorFilteredData.length === 0) {
        alert("No data found for the selected date, time range, or error codes 0 and 1.");
        return;
    }

    const timestamps = errorFilteredData.map(entry => new Date(entry.lastModifiedDate.$date));
    const errorCodes = errorFilteredData.map(entry => entry.errorCode);
    const errorMessages = errorFilteredData.map(entry => entry.errorMessage);

    const manualError0Count = errorFilteredData.filter(entry => entry.errorCode === 0 && entry.errorMessage === "MANUAL").length;
    const outOfPathError0Count = errorFilteredData.filter(entry =>
        entry.errorCode === 0 && entry.errorMessage.startsWith("OUT_OF_PATH")
    ).length;
    const manualError1Count = errorFilteredData.filter(entry => entry.errorCode === 1 && entry.errorMessage === "MANUAL").length;

    const trace = {
        x: timestamps,
        y: errorCodes,
        mode: 'markers',
        type: 'scatter',
        text: errorMessages,
        marker: {
            color: errorFilteredData.map(entry => {
                if (entry.errorCode === 0 && entry.errorMessage === "MANUAL") return 'blue';
                if (entry.errorCode === 0 && entry.errorMessage.startsWith("OUT_OF_PATH")) return 'green';
                if (entry.errorCode === 1 && entry.errorMessage === "MANUAL") return 'orange';
                return 'grey';
            })
        },
        name: 'Error Codes'
    };

    const layout = {
        title: 'Error Codes Over Time',
        xaxis: { title: 'Timestamp' },
        yaxis: { title: 'Error Code', tickvals: [0, 1], ticktext: ['Error Code 0', 'Error Code 1'] },
        showlegend: true,
        legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.2 },
        annotations: [
            {
                xref: 'paper',
                yref: 'paper',
                x: 0.02,
                y: 1.15,
                text: `<span style="color:green">Error Code 0 - Out of Path: ${outOfPathError0Count}</span>`,
                showarrow: false,
                align: 'left'
            },
            {
                xref: 'paper',
                yref: 'paper',
                x: 0.02,
                y: 1.1,
                text: `<span style="color:orange">Error Code 1 - Manual: ${manualError1Count}</span>`,
                showarrow: false,
                align: 'left'
            },
            {
                xref: 'paper',
                yref: 'paper',
                x: 0.02,
                y: 1.05,
                text: `<span style="color:blue">Error Code 0 - Manual: ${manualError0Count}</span>`,
                showarrow: false,
                align: 'left'
            }
        ]
    };

    Plotly.newPlot('graph-container', [trace], layout);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//Error Plots Implementations

// Handle JSON File Upload for Errors
document.getElementById("json-file").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const rawData = JSON.parse(e.target.result);
            const processedData = rawData.map(item => ({
                robotId: item.robotId,
                errorCode: item.errorCode,
                lastModifiedDate: new Date(item.lastModifiedDate.$date),
            }));

            window.errorData = processedData; // Store globally for filtering
            alert("Error JSON file loaded successfully!");
            populateDropdown("robot-id", processedData.map(item => item.robotId));
        } catch (err) {
            alert("Invalid JSON file. Please upload a valid file.");
        }
    };
    reader.readAsText(file);
});

// Populate Dropdown Options
function populateDropdown(elementId, values) {
    const dropdown = document.getElementById(elementId);
    const uniqueValues = [...new Set(values)];
    dropdown.innerHTML = '<option value="">All</option>';
    uniqueValues.forEach(value => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = `Robot ${value}`;
        dropdown.appendChild(option);
    });
}

// Filter and Plot Error Data
function filterAndPlotErrors() {
    if (!window.errorData) {
        alert("Please upload an error JSON file first!");
        return;
    }

    const robotId = document.getElementById("robot-id").value;
    const errorType = document.getElementById("error-type").value;
    const startTime = new Date(document.getElementById("error-start-time").value);
    const endTime = new Date(document.getElementById("error-end-time").value);

    let filteredData = window.errorData;

    if (robotId) filteredData = filteredData.filter(item => item.robotId == robotId);
    if (errorType && errorType !== "all") filteredData = filteredData.filter(item => item.errorCode == errorType);
    if (!isNaN(startTime)) filteredData = filteredData.filter(item => item.lastModifiedDate >= startTime);
    if (!isNaN(endTime)) filteredData = filteredData.filter(item => item.lastModifiedDate <= endTime);

    const errorCounts = {};
    filteredData.forEach(item => {
        errorCounts[item.errorCode] = (errorCounts[item.errorCode] || 0) + 1;
    });

    plotBarGraph(Object.keys(errorCounts).map(code => `Error ${code}`), Object.values(errorCounts));
}

// Handle JSON File Upload for Network Logs
document.getElementById("network-json-file").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const rawData = JSON.parse(e.target.result);
            window.networkData = rawData;
            populateDropdown("network-robot-id", rawData.map(entry => entry.robotId));
            // alert("Network JSON file loaded successfully!");
        } catch (err) {
            alert("Invalid JSON file. Please upload a valid file.");
        }
    };
    reader.readAsText(file);
});

// Filter and Plot Network Data
function filterAndPlotNetwork() {
    if (!window.networkData) {
        alert("Please upload a network JSON file first!");
        return;
    }

    const startDate = document.getElementById("network-start-date").value;
    const endDate = document.getElementById("network-end-date").value;
    const startTime = document.getElementById("network-start-time").value || "00:00";
    const endTime = document.getElementById("network-end-time").value || "23:59";
    const selectedRobots = Array.from(document.getElementById("network-robot-id").selectedOptions).map(option => option.value);

    if (!startDate || !endDate) {
        alert("Please select both start and end dates.");
        return;
    }

    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);

    let filteredData = window.networkData.filter(entry => {
        const entryDate = new Date(entry.lastModifiedDate.$date);
        return entry.errorCode === 404 && entryDate >= startDateTime && entryDate <= endDateTime;
    });

    if (selectedRobots.length && !selectedRobots.includes("all")) {
        filteredData = filteredData.filter(entry => selectedRobots.includes(String(entry.robotId)));
    }

    if (!filteredData.length) {
        alert("No data found for the selected filters.");
        return;
    }

    const disconnectionCounts = {};
    filteredData.forEach(entry => {
        const robotId = entry.robotId;
        const hour = new Date(entry.lastModifiedDate.$date).getHours();
        disconnectionCounts[robotId] = disconnectionCounts[robotId] || {};
        disconnectionCounts[robotId][hour] = (disconnectionCounts[robotId][hour] || 0) + 1;
    });

    plotNetworkGraphs(disconnectionCounts);
}

// Plot Bar Graph for Errors
function plotBarGraph(labels, data) {
    const chartContainer = document.getElementById("graph-container");
    Plotly.newPlot(chartContainer, [
        {
            x: labels,
            y: data,
            type: "bar",
            text: data.map(String),
            textposition: "auto",
            marker: { color: "rgba(55, 128, 191, 0.7)" },
        },
    ]);
}

// Plot Network Graphs
function plotNetworkGraphs(disconnectionCounts) {
    const container = document.getElementById("graph-container");
    container.innerHTML = ""; // Clear existing graphs

    Object.keys(disconnectionCounts).forEach(robotId => {
        const graphDiv = document.createElement("div");
        graphDiv.style.width = "100%";
        graphDiv.style.height = "400px";
        container.appendChild(graphDiv);

        const hours = Array.from({ length: 24 }, (_, i) => i);
        const counts = hours.map(hour => disconnectionCounts[robotId][hour] || 0);

        Plotly.newPlot(graphDiv, [{
            x: hours.map(h => `${h}:00`),
            y: counts,
            type: "bar",
            name: `Robot ${robotId}`,
        }], {
            title: `404 Errors for Robot ${robotId}`,
            xaxis: { title: "Hour" },
            yaxis: { title: "Disconnections" },
        });
    });
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Global task data
let taskData = [];

// Function to create a bar chart
function createBarChart(title, data, containerId) {
    const graphContainer = document.getElementById("graph-container");

    if (!graphContainer) {
        console.error("Graph container not found.");
        return;
    }

    if (!data || Object.keys(data).length === 0) {
        console.warn(`No data for chart: ${title}`);
        return;
    }

    const labels = Object.keys(data);
    const counts = Object.values(data);

    console.log(`Chart Data for ${title}:`, { labels, counts });

    // Remove existing chart div if present
    let existingChart = document.getElementById(containerId);
    if (existingChart) existingChart.remove();

    // Create a new div for the chart
    const chartDiv = document.createElement("div");
    chartDiv.style.width = "100%";
    chartDiv.style.height = "400px";
    chartDiv.id = containerId;
    graphContainer.appendChild(chartDiv);

    Plotly.newPlot(chartDiv, [{
        x: labels,
        y: counts,
        type: "bar",
        text: counts.map(String),
        textposition: "auto",
        marker: { color: "rgba(55, 128, 191, 0.7)" }
    }], {
        title: title,
        xaxis: { title: "Category", tickangle: -45 },
        yaxis: { title: "Task Count" },
        margin: { t: 50, r: 50, b: 150, l: 50 }
    }).then(() => {
        console.log(`Chart rendered: ${title}`);
    }).catch((error) => {
        console.error("Error rendering chart:", error);
    });
}

// Functions to generate counts
function generateCounts(data, key) {
    return data.reduce((counts, task) => {
        if (task[key]) counts[task[key]] = (counts[task[key]] || 0) + 1;
        return counts;
    }, {});
}

function generateSourceToDestinationCounts(data) {
    return data.reduce((counts, task) => {
        if (task.sourceLocation && task.destinationLocation) {
            const key = `${task.sourceLocation} -> ${task.destinationLocation}`;
            counts[key] = (counts[key] || 0) + 1;
        }
        return counts;
    }, {});
}

// Function to filter tasks
function filterTasks(data) {
    const startDateStr = document.getElementById("task-start-date").value;
    const endDateStr = document.getElementById("task-end-date").value;
    const startTimeStr = document.getElementById("task-start-time").value;
    const endTimeStr = document.getElementById("task-end-time").value;

    console.log("User Inputs - Start Date:", startDateStr, "End Date:", endDateStr, "Start Time:", startTimeStr, "End Time:", endTimeStr);

    // Convert date and time inputs into Date objects
    const startDateTime = startDateStr ? new Date(`${startDateStr}T${startTimeStr || "00:00"}`) : null;
    const endDateTime = endDateStr ? new Date(`${endDateStr}T${endTimeStr || "23:59"}`) : null;

    return data.filter((task) => {
        if (!task.timestamp || !task.timestamp.$date) {
            console.warn("Task has no valid timestamp:", task);
            return false;
        }

        const taskDateTime = new Date(task.timestamp.$date); // Convert task timestamp to Date object

        console.log("Checking Task - DateTime:", taskDateTime);

        // Apply filtering conditions
        if (startDateTime && taskDateTime < startDateTime) return false;
        if (endDateTime && taskDateTime > endDateTime) return false;

        return true;
    });
}

// Function to plot task report
function plotTaskReport() {
    if (!taskData.length) {
        //console.warn("No task data available.");
        //alert("No task data available. Please upload a JSON file.");
        return;
    }

    const filteredTasks = filterTasks(taskData);

    if (!filteredTasks.length) {
        console.warn("No tasks match the filters.");
        alert("No tasks match the filters. Adjust the date/time range.");
        return;
    }

    console.log("Filtered Tasks:", filteredTasks);

    // Clear old charts
    document.getElementById("graph-container").innerHTML = "";

    // Generate and render charts
    createBarChart("Source Tasks", generateCounts(filteredTasks, "sourceLocation"), "source-bar-chart");
    createBarChart("Destination Tasks", generateCounts(filteredTasks, "destinationLocation"), "destination-bar-chart");
    createBarChart("Source to Destination", generateSourceToDestinationCounts(filteredTasks), "source-to-destination-chart");
    createBarChart("Tasks by Robot ID", generateCounts(filteredTasks, "robotId"), "tasks-by-robot-id-chart");
}

// Function to handle file upload
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) {
        console.error("No file selected.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            taskData = JSON.parse(e.target.result);
            console.log("Task data loaded:", taskData);
        } catch (error) {
            console.error("Error parsing JSON file:", error);
        }
    };
    reader.readAsText(file);
}

// Initialize event listeners
document.addEventListener("DOMContentLoaded", () => {
    document.querySelector(".submit-btn")?.addEventListener("click", (e) => {
        e.preventDefault();
        plotTaskReport();
    });

    document.getElementById("task-json-file")?.addEventListener("change", handleFileUpload);
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Loading Delay Plots Implementations

document.addEventListener('DOMContentLoaded', function () {
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.addEventListener('click', processLoadingTimeData);
});

function processLoadingTimeData() {
    loadData();
}

function loadData() {
    const fileInput = document.getElementById('loading-json-file');
    const startDateTime = document.getElementById('loading-start-datetime').value;
    const endDateTime = document.getElementById('loading-end-datetime').value;
    const taskIdFilter = document.getElementById('loading-task-id').value;

    if (fileInput.files.length === 0) {
        alert('Please upload a JSON file.');
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function (event) {
        const jsonData = JSON.parse(event.target.result);
        processData(jsonData, startDateTime, endDateTime, taskIdFilter);
    };

    reader.readAsText(file);
}

function processData(jsonData, startDateTime, endDateTime, taskIdFilter) {
    const tasks = Object.values(jsonData);
    const timeDifferences = [];
    const labels = [];

    tasks.forEach(task => {
        // Check if RecvTime and PickTime exist
        if (!task.RecvTime || !task.PickTime) {
            console.warn('Skipping task: Missing RecvTime or PickTime', task);
            return; // Skip this task
        }

        // Convert RecvTime and PickTime to valid Date objects
        const recvTime = new Date(task.RecvTime.replace(/(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3'));
        const pickTime = new Date(task.PickTime.replace(/(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3'));

        // Filter tasks based on the provided date range and taskId
        if ((!startDateTime || recvTime >= new Date(startDateTime)) &&
            (!endDateTime || recvTime <= new Date(endDateTime)) &&
            (!taskIdFilter || task.taskId == taskIdFilter)) {
            const timeDiff = (pickTime - recvTime) / 1000; // Difference in seconds
            timeDifferences.push(timeDiff);
            labels.push(task.taskId);
        }
    });

    renderPlotlyChart(labels, timeDifferences);
}

function renderPlotlyChart(labels, timeDifferences) {
    const graphContainer = document.getElementById('graph-container');
    graphContainer.innerHTML = '';

    const averageTimeDifference = timeDifferences.reduce((a, b) => a + b, 0) / timeDifferences.length;

    const data = [{
        x: labels,
        y: timeDifferences,
        type: 'bar',
        marker: {
            color: 'rgba(75, 192, 192, 0.6)',
            line: {
                color: 'rgba(75, 192, 192, 1)',
                width: 1.5
            }
        },
        name: 'Time Difference'
    }, {
        x: labels,
        y: Array(labels.length).fill(averageTimeDifference),
        type: 'scatter',
        mode: 'lines',
        line: {
            color: 'rgba(255, 99, 132, 0.6)',
            width: 2
        },
        name: 'Average Time Difference'
    }];

    const layout = {
        title: 'Time Difference Between RecvTime and PickTime',
        xaxis: {
            title: 'Task ID',
            type: 'category',
            automargin: true
        },
        yaxis: {
            title: 'Time Difference (seconds)',
            automargin: true
        },
        hovermode: 'closest',
        margin: { t: 40, b: 100, l: 60, r: 40 },
        showlegend: true
    };

    const config = {
        responsive: true,
        scrollZoom: true,
        displayModeBar: true,
        modeBarButtonsToAdd: ['resetViews'],
        modeBarButtonsToRemove: ['toImage']
    };

    Plotly.newPlot(graphContainer, data, layout, config);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Task Delay Plots Implementations

document.addEventListener('DOMContentLoaded', function () {
    const submitBtn = document.querySelector('#task-delay-filters .submit-btn');
    submitBtn.addEventListener('click', processTaskDelayData);
});

function processTaskDelayData() {
    loadTaskDelayData();
}

function loadTaskDelayData() {
    const fileInput = document.getElementById('delay-json-file');
    const startDateTime = document.getElementById('delay-start-datetime').value;
    const endDateTime = document.getElementById('delay-end-datetime').value;
    const taskIdFilter = document.getElementById('delay-task-id').value;

    if (fileInput.files.length === 0) {
        alert('Please upload a JSON file.');
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function (event) {
        const jsonData = JSON.parse(event.target.result);
        processTaskDelay(jsonData, startDateTime, endDateTime, taskIdFilter);
    };

    reader.readAsText(file);
}

function processTaskDelay(jsonData, startDateTime, endDateTime, taskIdFilter) {
    const tasks = Object.values(jsonData);
    const delayDifferences = [];
    const labels = [];

    tasks.forEach(task => {
        // Check if RAPTime and AssignTime exist
        if (!task.RAPTime || !task.AssignTime) {
            console.warn('Skipping task: Missing RAPTime or AssignTime', task);
            return; // Skip this task
        }

        // Convert RAPTime and AssignTime to valid Date objects
        const rapTime = new Date(task.RAPTime.replace(/(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3'));
        const assignTime = new Date(task.AssignTime.replace(/(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3'));

        // Filter tasks based on the provided date range and taskId
        if (taskIdFilter) {
            if (task.taskId == taskIdFilter) {
                const delayDiff = (assignTime - rapTime) / 1000; // Difference in seconds
                delayDifferences.push(delayDiff);
                labels.push(task.taskId);
            }
        } else {
            if ((!startDateTime || rapTime >= new Date(startDateTime)) &&
                (!endDateTime || rapTime <= new Date(endDateTime))) {
                const delayDiff = (assignTime - rapTime) / 1000; // Difference in seconds
                delayDifferences.push(delayDiff);
                labels.push(task.taskId);
            }
        }
    });

    renderTaskDelayChart(labels, delayDifferences);
}

function renderTaskDelayChart(labels, delayDifferences) {
    const graphContainer = document.getElementById('graph-container');
    graphContainer.innerHTML = '';

    const averageDelayDifference = delayDifferences.reduce((a, b) => a + b, 0) / delayDifferences.length;

    const data = [{
        x: labels,
        y: delayDifferences,
        type: 'bar',
        marker: {
            color: 'rgba(75, 192, 192, 0.6)',
            line: {
                color: 'rgba(75, 192, 192, 1)',
                width: 1.5
            }
        },
        name: 'Task Delay'
    }, {
        x: labels,
        y: Array(labels.length).fill(averageDelayDifference),
        type: 'scatter',
        mode: 'lines',
        line: {
            color: 'rgba(255, 99, 132, 0.6)',
            width: 2
        },
        name: 'Average Task Delay'
    }];

    const layout = {
        title: 'Task Delay Between RAPTime and AssignTime',
        xaxis: {
            title: 'Task ID',
            type: 'category',
            automargin: true
        },
        yaxis: {
            title: 'Task Delay (ms)',
            automargin: true
        },
        hovermode: 'closest',
        margin: { t: 40, b: 100, l: 60, r: 40 },
        showlegend: true
    };

    const config = {
        responsive: true,
        scrollZoom: true,
        displayModeBar: true,
        modeBarButtonsToAdd: ['resetViews'],
        modeBarButtonsToRemove: ['toImage']
    };

    Plotly.newPlot(graphContainer, data, layout, config);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Task Cycle Plots Implementations

document.addEventListener('DOMContentLoaded', function () {
    const submitBtn = document.querySelector('#task-cycle-filters .submit-btn');
    submitBtn.addEventListener('click', processTaskCycleData);
});

function processTaskCycleData() {
    loadTaskCycleData();
}

function loadTaskCycleData() {
    const fileInput = document.getElementById('cycle-json-file');
    const startDateTime = document.getElementById('cycle-start-datetime').value;
    const endDateTime = document.getElementById('cycle-end-datetime').value;
    const taskIdFilter = document.getElementById('cycle-task-id').value;

    if (fileInput.files.length === 0) {
        alert('Please upload a JSON file.');
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function (event) {
        const jsonData = JSON.parse(event.target.result);
        processTaskCycle(jsonData, startDateTime, endDateTime, taskIdFilter);
    };

    reader.readAsText(file);
}

function processTaskCycle(jsonData, startDateTime, endDateTime, taskIdFilter) {
    const tasks = Object.values(jsonData);
    const cycleDifferences = [];
    const labels = [];

    tasks.forEach(task => {
        // Check if PickTime and DestinationReachTime exist
        if (!task.PickTime || !task.DestinationReachTime) {
            console.warn('Skipping task: Missing PickTime or DestinationReachTime', task);
            return;
        }

        // Convert PickTime and DestinationReachTime to valid Date objects
        const pickTime = new Date(task.PickTime.replace(/(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3'));
        const destinationReachTime = new Date(task.DestinationReachTime.replace(/(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3'));

        // Filter tasks based on the provided date range and taskId
        if (taskIdFilter) {
            if (task.taskId == taskIdFilter) {
                const cycleDiff = (destinationReachTime - pickTime) / 1000;
                cycleDifferences.push(cycleDiff);
                labels.push(task.taskId);
            }
        } else {
            if ((!startDateTime || pickTime >= new Date(startDateTime)) &&
                (!endDateTime || pickTime <= new Date(endDateTime))) {
                const cycleDiff = (destinationReachTime - pickTime) / 1000;
                cycleDifferences.push(cycleDiff);
                labels.push(task.taskId);
            }
        }
    });

    renderTaskCycleChart(labels, cycleDifferences);
}

function renderTaskCycleChart(labels, cycleDifferences) {
    const graphContainer = document.getElementById('graph-container');
    graphContainer.innerHTML = '';

    const averageCycleDifference = cycleDifferences.reduce((a, b) => a + b, 0) / cycleDifferences.length;

    const data = [{
        x: labels,
        y: cycleDifferences,
        type: 'bar',
        marker: {
            color: 'rgba(75, 192, 192, 0.6)',
            line: {
                color: 'rgba(75, 192, 192, 1)',
                width: 1.5
            }
        },
        name: 'Task Cycle'
    }, {
        x: labels,
        y: Array(labels.length).fill(averageCycleDifference),
        type: 'scatter',
        mode: 'lines',
        line: {
            color: 'rgba(255, 99, 132, 0.6)',
            width: 2
        },
        name: 'Average Task Cycle'
    }];

    const layout = {
        title: 'Task Cycle Between PickTime and DestinationReachTime',
        xaxis: {
            title: 'Task ID',
            type: 'category',
            automargin: true
        },
        yaxis: {
            title: 'Task Cycle (ms)',
            automargin: true
        },
        hovermode: 'closest',
        margin: { t: 40, b: 100, l: 60, r: 40 },
        showlegend: true
    };

    const config = {
        responsive: true,
        scrollZoom: true,
        displayModeBar: true,
        modeBarButtonsToAdd: ['resetViews'],
        modeBarButtonsToRemove: ['toImage']
    };

    Plotly.newPlot(graphContainer, data, layout, config);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


document.getElementById("report-form").addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent default form submission
    validateAndShowPopup();
});

function validateAndShowPopup() {
    let inputFolder = document.getElementById("input-folder").files;

    if (inputFolder.length === 0) {
        alert("Please select a folder containing JSON files.");
        return;
    }

    document.getElementById("plot-popup").style.display = "block";
}

// Handles the plot selection and processes files
function submitForm() {
    let selectedPlots = [...document.querySelectorAll("input[name='plots']:checked")].map(input => input.value);
    document.getElementById("plot-popup").style.display = "none"; // Hide popup

    let inputFolder = document.getElementById("input-folder").files;
    let files = Array.from(inputFolder);

    let errorData = [];
    let throughputData = [];
    let taskData = [];

    let fileReadPromises = files.map(file => {
        return new Promise((resolve, reject) => {
            let reader = new FileReader();
            reader.onload = function (event) {
                try {
                    let jsonData = JSON.parse(event.target.result);

                    if (jsonData.some(entry => entry.hasOwnProperty("taskId") && entry.hasOwnProperty("sourceLocation") && entry.hasOwnProperty("destinationLocation") && entry.hasOwnProperty("robotId"))) {
                        taskData.push(...jsonData);
                    }
                    else if (jsonData.some(entry => entry.hasOwnProperty("errorCode") && entry.hasOwnProperty("errorCount"))) {
                        errorData.push(...jsonData);
                    }
                    else if (jsonData.some(entry => entry.hasOwnProperty("throughput") && entry.hasOwnProperty("lastModifiedDate"))) {
                        throughputData.push(...jsonData);
                    }

                    resolve();
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    });

    Promise.all(fileReadPromises).then(() => {
        document.getElementById("graph-container").innerHTML = ""; // Clear previous plots

        if (selectedPlots.includes("error-plots")) {
            createGraphContainer("error-plot", "Error Plot");
            plotErrorGraph(errorData, "error-plot");
        }

        if (selectedPlots.includes("throughput-plots")) {
            createGraphContainer("throughput-plot", "Throughput Plot");
            plotThroughputGraph(throughputData, "throughput-plot");
        }

        if (selectedPlots.includes("task-plots")) {
            createGraphContainer("task-plot", "Task Plot");
            plotTaskGraph(taskData, "task-plot");
        }

        let delayData = taskData.filter(entry =>
            entry.hasOwnProperty("RecvTime") &&
            entry.hasOwnProperty("AssignTime") &&
            entry.hasOwnProperty("PickTime") &&
            entry.hasOwnProperty("CompletedTime")
        );

        if (selectedPlots.includes("delay-plots") && delayData.length > 0) {
            createGraphContainer("delay-plot", "Delay Plot");
            plotDelayHistograms(delayData, "delay-plot");
        }
    }).catch(error => {
        console.error("Error processing JSON files:", error);
    });
}

// Function to create a separate div for each plot
function createGraphContainer(id, title) {
    let graphContainer = document.getElementById("graph-container");
    let div = document.createElement("div");
    div.id = id;
    div.style.marginBottom = "30px";

    let heading = document.createElement("h3");
    heading.innerText = title;
    heading.style.textAlign = "center";

    graphContainer.appendChild(heading);
    graphContainer.appendChild(div);
}

// Function to plot Error Graph
function plotErrorGraph(errorData, divId) {
    if (!errorData || errorData.length === 0) {
        console.log("No error data available.");
        return;
    }

    let errorCounts = {};

    // Count occurrences of each errorCode
    errorData.forEach(entry => {
        if (entry.hasOwnProperty("errorCode")) {
            let errorCode = String(entry.errorCode);
            errorCounts[errorCode] = (errorCounts[errorCode] || 0) + 1;
        }
    });
    let sortedData = Object.entries(errorCounts)
        .map(([code, count]) => ({ code, count }))
        .filter(d => d.count > 0)
        .sort((a, b) => parseInt(a.code) - parseInt(b.code));

    // If no valid error codes, do nothing
    if (sortedData.length === 0) {
        console.log("No valid error codes with count > 0 found.");
        return;
    }

    let trace = {
        x: sortedData.map(d => `Error ${d.code}`),
        y: sortedData.map(d => d.count),
        type: "bar",
        name: "Error Counts",
        marker: { color: "red" },
        text: sortedData.map(d => d.count),
        textposition: "auto"
    };

    let layout = {
        title: "Error Codes vs Frequency",
        xaxis: { title: "Error Code", tickmode: "linear" },
        yaxis: { title: "Count" },
        hovermode: "closest",
        dragmode: "pan"
    };

    Plotly.newPlot(divId, [trace], layout, { scrollZoom: true });
}

// Function to plot Throughput Graph
function plotThroughputGraph(throughputData, divId) {
    if (throughputData.length === 0) return;

    let timestamps = [];
    let throughputValues = [];

    throughputData.forEach(entry => {
        if (entry.lastModifiedDate && entry.throughput) {
            timestamps.push(new Date(entry.lastModifiedDate.$date));
            throughputValues.push(entry.throughput);
        }
    });

    let trace = {
        x: timestamps,
        y: throughputValues,
        type: "scatter",
        mode: "lines+markers",
        name: "Throughput Over Time",
        line: { color: "blue" }
    };

    let layout = {
        title: "Throughput Over Time",
        xaxis: { title: "Time" },
        yaxis: { title: "Throughput" },
        hovermode: "closest",
        dragmode: "pan"
    };

    Plotly.newPlot(divId, [trace], layout, { scrollZoom: true });
}

/////////////////////////            Task Graph

// Function to ensure divs exist for task graphs
function ensureTaskGraphDiv(divId) {
    let container = document.getElementById("graph-container");
    if (!document.getElementById(divId)) {
        let newDiv = document.createElement("div");
        newDiv.id = divId;
        newDiv.style.marginBottom = "20px"; // Add some spacing
        container.appendChild(newDiv);
    }
}
// Function to count pick-to-drop occurrences
function generatePickToDropCounts(data) {
    let counts = {};
    data.forEach((task) => {
        if (task.sourceLocation && task.destinationLocation) {
            const key = `${task.sourceLocation} -> ${task.destinationLocation}`;
            counts[key] = (counts[key] || 0) + 1;
        }
    });
    return counts;
}

// Function to plot task-related graphs properly
function plotTaskGraph(taskData) {
    if (!Array.isArray(taskData) || taskData.length === 0) {
        console.warn("No valid task data available.");
        alert("No valid task data available.");
        return;
    }

    // console.log("🔍 Processing task data...", taskData);

    // Generate counts for each category
    const pickCounts = generateCounts(taskData, "sourceLocation");
    const dropCounts = generateCounts(taskData, "destinationLocation");
    const pickToDropCounts = generatePickToDropCounts(taskData);
    const robotTaskCounts = generateCounts(taskData, "robotId");

    // Filter out robotIds with zero tasks
    let filteredRobotIds = [];
    let filteredRobotValues = [];
    Object.keys(robotTaskCounts).forEach(robotId => {
        if (robotTaskCounts[robotId] > 0) {
            filteredRobotIds.push(robotId);
            filteredRobotValues.push(robotTaskCounts[robotId]);
        }
    });

    // Ensure the divs exist before plotting
    ensureTaskGraphDiv("task-plot-pick");
    ensureTaskGraphDiv("task-plot-drop");
    ensureTaskGraphDiv("task-plot-pick-drop");
    ensureTaskGraphDiv("task-plot-robot");

    // Plot all graphs immediately (no delay needed)
    plotBarChart("task-plot-pick", "Pick Tasks", Object.keys(pickCounts), Object.values(pickCounts), "blue");
    plotBarChart("task-plot-drop", "Drop Tasks", Object.keys(dropCounts), Object.values(dropCounts), "orange");
    plotBarChart("task-plot-pick-drop", "Pick to Drop", Object.keys(pickToDropCounts), Object.values(pickToDropCounts), "green");

    if (filteredRobotIds.length > 0) {
        plotBarChart("task-plot-robot", "Tasks by Robot", filteredRobotIds, filteredRobotValues, "red");
    } else {
        console.warn("⚠️ No robots have completed any tasks.");
        alert("No robots have completed any tasks.");
    }
}
// Function to plot a bar chart
function plotBarChart(divId, title, labels, values, color) {
    let trace = {
        x: labels,
        y: values,
        type: "bar",
        name: title,
        marker: { color: color }
    };

    let layout = {
        title: title,
        xaxis: {
            title: "Category",
            tickangle: -45,
            type: "category",
            categoryorder: "array",
            categoryarray: labels
        },
        yaxis: { title: "Task Count" },
        margin: { t: 50, r: 50, b: 100, l: 50 }
    };

    Plotly.newPlot(divId, [trace], layout);
}

/////////////////////////            Delay Graph
// Function to create divs dynamically if they don't exist
function ensureDivExists(divId) {
    let container = document.getElementById("graph-container");
    if (!document.getElementById(divId)) {
        let newDiv = document.createElement("div");
        newDiv.id = divId;
        newDiv.style.marginBottom = "20px"; // Add some spacing
        container.appendChild(newDiv);
    }
}

// Function to parse timestamps from JSON data
function parseTimestamp(timestamp) {
    if (!timestamp) return null;

    // Handle timestamps in "YYYY:MM:DD HH:MM:SS.SSS" format
    let parts = timestamp.match(/(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2}.\d{3})/);
    if (parts) {
        return new Date(`${parts[1]}-${parts[2]}-${parts[3]}T${parts[4]}:${parts[5]}:${parts[6]}Z`).getTime();
    }

    return new Date(timestamp).getTime(); // Fallback
}

// Function to plot Delay Histograms separately with Task ID on X-axis
function plotDelayHistograms(delayData) {
    if (!Array.isArray(delayData) || delayData.length === 0) {
        console.warn("🚨 No valid delay data available.");
        alert("No valid delay data available.");
        return;
    }

    let loadingTimes = [];
    let taskDelays = [];
    let taskCycleTimes = [];
    let taskIds = [];

    delayData.forEach(entry => {
        let recvTime = parseTimestamp(entry.RecvTime);
        let pickTime = parseTimestamp(entry.PickTime);
        let assignTime = parseTimestamp(entry.AssignTime);
        let rapTime = parseTimestamp(entry.RAPTime);
        let completedTime = parseTimestamp(entry.CompletedTime);

        // Ensure taskId is stored as a string to avoid scientific notation
        if (entry.taskId) {
            taskIds.push(entry.taskId.toString());  // Convert taskId to string
        }

        if (recvTime && pickTime) {
            loadingTimes.push((pickTime - recvTime) / 1000);
        } else {
            loadingTimes.push(null);
        }

        if (assignTime && rapTime && rapTime > 0) {
            taskDelays.push((assignTime - rapTime) / 1000);
        } else {
            taskDelays.push(null);
        }

        if (completedTime && pickTime) {
            taskCycleTimes.push((completedTime - pickTime) / 1000);
        } else {
            taskCycleTimes.push(null);
        }
    });

    // Ensure the divs exist before plotting
    ensureDivExists("delay-plot-loading");
    ensureDivExists("delay-plot-task");
    ensureDivExists("delay-plot-cycle");

    // Function to plot a bar chart with average time
    function plotBarChart(data, title, color, delay, divId) {
        setTimeout(() => {
            let avgTime = data.reduce((sum, val) => sum + (val || 0), 0) / data.length;

            let trace = {
                x: taskIds,
                y: data,
                type: "bar",
                marker: { color: color },
                name: title
            };

            let avgLine = {
                x: taskIds,
                y: Array(taskIds.length).fill(avgTime),
                type: "scatter",
                mode: "lines",
                line: { dash: "dash", color: "red" },
                name: "Average Time"
            };

            let layout = {
                title: title,
                xaxis: { 
                    title: "Task ID", 
                    tickangle: -45,
                    tickmode: "array",
                    tickvals: taskIds, 
                    ticktext: taskIds.map(id => id)  // Ensure full taskId is displayed
                },
                yaxis: { title: "Time Taken (seconds)" },
                bargap: 0.1
            };

            Plotly.newPlot(divId, [trace, avgLine], layout);
        }, delay);
    }

    // Plot each delay type in its separate div with different timeouts
    plotBarChart(loadingTimes, "Loading Delay", "blue", 500, "delay-plot-loading");
    plotBarChart(taskDelays, "Task Delay", "orange", 1000, "delay-plot-task");
    plotBarChart(taskCycleTimes, "Task Cycle Time", "green", 1500, "delay-plot-cycle");
}

/////////////////////////            Download PDF Graph

async function downloadPlotsAsPDF() {
    // console.log(" Starting fast plot capture...");

    const { jsPDF } = window.jspdf;
    let pdf = new jsPDF("p", "mm", "a4");
    let plotContainer = document.getElementById("graph-container");

    if (!plotContainer) {
        console.error("Error: #graph-container not found!");
        alert("Error: No graph container found.");
        return;
    }

    let plots = [...plotContainer.children].filter(plot =>
        plot.querySelector(".plotly") && plot.offsetHeight > 0 && plot.offsetWidth > 0
    );

    console.log(`🔍 Found ${plots.length} valid plots.`);

    if (plots.length === 0) {
        alert("No plots available to save.");
        return;
    }

    let images = [];

    // Capture all plots in parallel for speed
    let capturePromises = plots.map(async (plot, index) => {
        // console.log(`Capturing plot ${index + 1}...`);
        try {
            let imgData = await Plotly.toImage(plot, { format: "png", width: 800, height: 400 });
            images.push(imgData);
            // console.log(`Plot ${index + 1} captured.`);
        } catch (error) {
            console.error(`Error capturing plot ${index + 1}:`, error);
        }
    });

    await Promise.all(capturePromises);

    // console.log("Merging images into PDF...");

    let yPosition = 20;
    let imgWidth = 180;
    let margin = 5;
    let pageHeight = pdf.internal.pageSize.height;

    images.forEach((img, i) => {
        let imgHeight = 90;

        if (yPosition + imgHeight > pageHeight - margin) {
            pdf.addPage();
            yPosition = 20;
        }

        pdf.setTextColor(255, 0, 0);
        pdf.setFontSize(20);
        pdf.text("ADDVERB", 10, 15); // Top-left corner

        pdf.addImage(img, "PNG", 15, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + margin;
    });

    //  console.log(" Saving PDF...");
    pdf.save("plots_report.pdf");
    // console.log(" Download completed.");
}

// Attach to Button Click
document.addEventListener("DOMContentLoaded", function () {
    let downloadBtn = document.getElementById("download-btn");
    if (downloadBtn) {
        downloadBtn.addEventListener("click", downloadPlotsAsPDF);
    } else {
        console.error(" Download button not found.");
    }
});

// Debugging Log
window.onload = function () {
    // console.log("Script loaded successfully.");
};

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
        console.warn("No Plotly chart found inside the graph container.");
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

// Tasks Plots Implementations

// Global task data
let taskData = [];

// Function to create a bar chart
function createBarChart(title, data, containerId) {
    const graphContainer = document.getElementById("graph-container");

    // Check if the graph container exists
    if (!graphContainer) {
        console.error("Graph container element not found in the DOM.");
        return;
    }

    // Check if the data is valid
    if (!data || Object.keys(data).length === 0) {
        console.warn(`Invalid or empty data provided for chart: ${title}`);
        return;
    }

    const labels = Object.keys(data);
    const counts = Object.values(data);

    // Debug: Log chart data
    console.log(`Chart Data for ${title}:`, { labels, counts });

    // Create a new div for the chart
    const chartDiv = document.createElement("div");
    chartDiv.style.width = "100%";
    chartDiv.style.height = "400px";
    chartDiv.id = containerId;

    // Log the chart div being created
    console.log(`Creating chart div with ID: ${containerId}`);

    // Append the chart div to the graph container
    graphContainer.appendChild(chartDiv);

    // Ensure the chart is rendering
    console.log("Rendering chart for", title);
    Plotly.newPlot(
        chartDiv,
        [
            {
                x: labels,
                y: counts,
                type: "bar",
                text: counts.map(String), // Show the count value on the bars
                textposition: "auto", // Automatically position the text inside the bars
                marker: { color: "rgba(55, 128, 191, 0.7)" },
            },
        ],
        {
            title: title,
            xaxis: { title: "Category", tickangle: -45 },
            yaxis: { title: "Task Count" },
            margin: { t: 50, r: 50, b: 150, l: 50 }, // Margin to avoid label overlap
        }
    ).then(() => {
        console.log(`Chart rendered successfully: ${title}`);
    }).catch((error) => {
        console.error("Error rendering chart:", error);
    });
}

// Function to generate source counts
function generateSourceCounts(data) {
    const counts = {};
    data.forEach((task) => {
        const source = task.sourceLocation;
        if (source) {
            counts[source] = (counts[source] || 0) + 1;
        }
    });
    console.log("Source Counts Debug: ", counts);
    return counts;
}

// Function to generate destination counts
function generateDestinationCounts(data) {
    const counts = {};
    data.forEach((task) => {
        const destination = task.destinationLocation;
        if (destination) {
            counts[destination] = (counts[destination] || 0) + 1;
        }
    });
    console.log("Destination Counts Debug: ", counts);
    return counts;
}

// Function to generate source to destination counts
function generateSourceToDestinationCounts(data) {
    const counts = {};
    data.forEach((task) => {
        const source = task.sourceLocation;
        const destination = task.destinationLocation;
        if (source && destination) {
            const key = `${source} -> ${destination}`;
            counts[key] = (counts[key] || 0) + 1;
        }
    });
    console.log("Source to Destination Counts Debug: ", counts);
    return counts;
}

// Function to generate task counts by robotId
function generateTaskByRobotId(data) {
    const counts = {};
    data.forEach((task) => {
        const robotId = task.robotId;
        if (robotId) {
            counts[robotId] = (counts[robotId] || 0) + 1;
        }
    });
    console.log("Task Counts by Robot ID Debug: ", counts);
    return counts;
}

// Function to filter tasks based on user inputs
function filterTasks(data) {
    const startDate = document.getElementById("task-start-date").value;
    const endDate = document.getElementById("task-end-date").value;
    const startTime = document.getElementById("task-start-time").value;
    const endTime = document.getElementById("task-end-time").value;

    console.log("User Inputs - Start Date:", startDate, "End Date:", endDate, "Start Time:", startTime, "End Time:", endTime);

    return data.filter((task) => {
        const taskTimestamp = task.timestamp?.$date;
        if (!taskTimestamp) {
            console.warn("Task has no valid timestamp:", task);
            return false;
        }

        // Convert the task timestamp to a Date object
        const taskDateObj = new Date(taskTimestamp);

        // Extract date and time components
        const taskDate = taskDateObj.toISOString().split("T")[0];
        const taskTime = taskDateObj.toTimeString().split(" ")[0].substring(0, 5);

        console.log("Task Timestamp:", taskTimestamp, "Task Date:", taskDate, "Task Time:", taskTime);

        // Filter by date (if startDate or endDate is provided)
        if (startDate && taskDate < startDate) {
            console.log("Task filtered out (before start date):", task);
            return false;
        }
        if (endDate && taskDate > endDate) {
            console.log("Task filtered out (after end date):", task);
            return false;
        }

        // Filter by time (if startTime or endTime is provided)
        if (startTime && taskTime < startTime) {
            console.log("Task filtered out (before start time):", task);
            return false;
        }
        if (endTime && taskTime > endTime) {
            console.log("Task filtered out (after end time):", task);
            return false;
        }

        console.log("Task included in results:", task);
        return true;
    });
}

// Function to plot task report
function plotTaskReport() {
    if (!taskData || taskData.length === 0) {
        console.warn("No task data available to plot.");
        alert("No task data available to plot. Please upload a JSON file.");
        return;
    }

    // Filter tasks based on user inputs
    const filteredTasks = filterTasks(taskData);

    if (filteredTasks.length === 0) {
        console.warn("No tasks match the filter criteria.");
        alert("No tasks match the filter criteria. Please adjust your filters.");
        return;
    }

    // Debug: Log filtered tasks
    console.log("Filtered Tasks:", filteredTasks);

    // Clear the graph container before rendering new charts
    const graphContainer = document.getElementById("graph-container");
    graphContainer.innerHTML = "";

    // Generate counts for each chart
    const sourceCounts = generateSourceCounts(filteredTasks);
    const destinationCounts = generateDestinationCounts(filteredTasks);
    const sourceToDestinationCounts = generateSourceToDestinationCounts(filteredTasks);
    const taskByRobotId = generateTaskByRobotId(filteredTasks);

    // Debug: Log counts for each chart
    console.log("Source Counts:", sourceCounts);
    console.log("Destination Counts:", destinationCounts);
    console.log("Source to Destination Counts:", sourceToDestinationCounts);
    console.log("Task Counts by Robot ID:", taskByRobotId);

    // Create all the charts
    createBarChart("Source Tasks", sourceCounts, "source-bar-chart");
    createBarChart("Destination Tasks", destinationCounts, "destination-bar-chart");
    createBarChart("Source to Destination Tasks", sourceToDestinationCounts, "source-to-destination-bar-chart");
    createBarChart("Tasks by Robot ID", taskByRobotId, "tasks-by-robot-id-bar-chart");
}

// Function to handle file input and read the task data
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
            console.log("File data loaded:", taskData);
        } catch (error) {
            console.error("Error parsing JSON file:", error);
        }
    };
    reader.readAsText(file);
}

// Function to download task data
function downloadFile() {
    if (!taskData || taskData.length === 0) {
        console.warn("No data available to download.");
        alert("No task data available to download. Please upload a JSON file.");
        return;
    }

    const jsonBlob = new Blob([JSON.stringify(taskData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(jsonBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "taskData.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url); // Clean up URL object
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
    // console.log("DOM fully loaded and parsed.");

    // Attach event listeners
    const submitButton = document.querySelector(".submit-btn");
    // const downloadButton = document.querySelector(".download-btn");
    const fileInput = document.getElementById("task-json-file");

    if (submitButton) {
        submitButton.addEventListener("click", (e) => {
            e.preventDefault(); // Prevent form submission
            console.log("Submit button clicked.");
            plotTaskReport();
        });
    } else {
        console.error("Submit button not found in the DOM.");
    }

    // if (downloadButton) {
    //     downloadButton.addEventListener("click", (e) => {
    //         e.preventDefault(); // Prevent form submission
    //         console.log("Download button clicked.");
    //         downloadFile();
    //     });
    // } else {
    //     console.error("Download button not found in the DOM.");
    // }

    if (fileInput) {
        fileInput.addEventListener("change", handleFileUpload);
    } else {
        console.error("File input element not found in the DOM.");
    }
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

// document.addEventListener('DOMContentLoaded', function () {
//     const inputFolder = document.getElementById('input-folder');
//     inputFolder.addEventListener('change', handleFolderInput);

//     const allTasksCheckbox = document.getElementById('all-tasks');
//     const taskCheckboxes = document.querySelectorAll('input[name="tasks"]');
//     allTasksCheckbox.addEventListener('change', function () {
//         taskCheckboxes.forEach(checkbox => {
//             if (checkbox !== allTasksCheckbox) {
//                 checkbox.checked = allTasksCheckbox.checked;
//             }
//         });
//     });
//     taskCheckboxes.forEach(checkbox => {
//         checkbox.addEventListener('change', function () {
//             if (!checkbox.checked) {
//                 allTasksCheckbox.checked = false;
//             } else {
//                 allTasksCheckbox.checked = Array.from(taskCheckboxes).every(cb => cb.checked);
//             }
//         });
//     });

//     const allErrorsCheckbox = document.getElementById('all-errors');
//     const errorCheckboxes = document.querySelectorAll('input[name="errors"]');
//     allErrorsCheckbox.addEventListener('change', function () {
//         errorCheckboxes.forEach(checkbox => {
//             if (checkbox !== allErrorsCheckbox) {
//                 checkbox.checked = allErrorsCheckbox.checked;
//             }
//         });
//     });
//     errorCheckboxes.forEach(checkbox => {
//         checkbox.addEventListener('change', function () {
//             if (!checkbox.checked) {
//                 allErrorsCheckbox.checked = false;
//             } else {
//                 allErrorsCheckbox.checked = Array.from(errorCheckboxes).every(cb => cb.checked);
//             }
//         });
//     });

//     const allDelaysCheckbox = document.getElementById('all-delays');
//     const delayCheckboxes = document.querySelectorAll('input[name="delays"]');
//     allDelaysCheckbox.addEventListener('change', function () {
//         delayCheckboxes.forEach(checkbox => {
//             if (checkbox !== allDelaysCheckbox) {
//                 checkbox.checked = allDelaysCheckbox.checked;
//             }
//         });
//     });
//     delayCheckboxes.forEach(checkbox => {
//         checkbox.addEventListener('change', function () {
//             if (!checkbox.checked) {
//                 allDelaysCheckbox.checked = false;
//             } else {
//                 allDelaysCheckbox.checked = Array.from(delayCheckboxes).every(cb => cb.checked);
//             }
//         });
//     });

//     const allPlotsCheckbox = document.getElementById('all-plots');
//     const plotCheckboxes = document.querySelectorAll('input[name="plots"]');
//     allPlotsCheckbox.addEventListener('change', function () {
//         plotCheckboxes.forEach(checkbox => {
//             if (checkbox !== allPlotsCheckbox) {
//                 checkbox.checked = allPlotsCheckbox.checked;
//             }
//         });
//     });
//     plotCheckboxes.forEach(checkbox => {
//         checkbox.addEventListener('change', function () {
//             if (!checkbox.checked) {
//                 allPlotsCheckbox.checked = false;
//             } else {
//                 allPlotsCheckbox.checked = Array.from(plotCheckboxes).every(cb => cb.checked);
//             }
//         });
//     });
// });

// async function submitAllReportsFilters() {
//     const inputFolder = document.getElementById('input-folder').files;
//     const errorCheckboxes = document.querySelectorAll('input[name="errors"]:checked');
//     const taskCheckboxes = document.querySelectorAll('input[name="tasks"]:checked');
//     const delayCheckboxes = document.querySelectorAll('input[name="delays"]:checked');
//     const plotCheckboxes = document.querySelectorAll('input[name="plots"]:checked');
//     const startDateTime = document.getElementById('start-datetime').value;
//     const endDateTime = document.getElementById('end-datetime').value;
//     const jsonFile = document.getElementById('json-file').files[0];

//     const selectedErrors = Array.from(errorCheckboxes).map(cb => cb.value);
//     const selectedTasks = Array.from(taskCheckboxes).map(cb => cb.value);
//     const selectedDelays = Array.from(delayCheckboxes).map(cb => cb.value);
//     const selectedPlots = Array.from(plotCheckboxes).map(cb => cb.value);

//     console.log('Input Folder:', inputFolder);
//     console.log('Selected Errors:', selectedErrors);
//     console.log('Selected Tasks:', selectedTasks);
//     console.log('Selected Delays:', selectedDelays);
//     console.log('Selected Plots:', selectedPlots);
//     console.log('Start Date and Time:', startDateTime);
//     console.log('End Date and Time:', endDateTime);
//     console.log('JSON File:', jsonFile);

//     // Process the selected filters and data as needed
//     if (selectedPlots.includes('all-plots') || selectedPlots.includes('throughput-plots')) {
//         await submitThroughputFilters();
//     }

//     if (selectedTasks.includes('all-tasks') || selectedTasks.includes('pick-tasks') || selectedTasks.includes('drop-tasks') || selectedTasks.includes('pick-to-drop-tasks') || selectedTasks.includes('tasks-by-robot')) {
//         plotTaskReport();
//     }

//     if (selectedErrors.includes('all-errors') || selectedErrors.includes('network-errors') || selectedErrors.includes('start-stop-errors') || selectedErrors.includes('navigation-errors') || selectedErrors.includes('diagnostic-errors') || selectedErrors.includes('motor-driver-errors') || selectedErrors.includes('saviour-errors') || selectedErrors.includes('loading-unloading-errors') || selectedErrors.includes('charger-errors') || selectedErrors.includes('estop-errors')) {
//         filterAndPlotErrors();
//     }

//     if (selectedDelays.includes('all-delays') || selectedDelays.includes('loading-delay') || selectedDelays.includes('task-delay') || selectedDelays.includes('task-cycle')) {
//         processTaskDelayData();
//     }
// }

// async function submitThroughputFilters() {
//     const startDateTime = document.getElementById("start-datetime").value;
//     const endDateTime = document.getElementById("end-datetime").value;
//     const fileInput = document.getElementById("json-file");

//     if (!fileInput.files.length) {
//         alert("Please upload a .json file.");
//         return;
//     }

//     const file = fileInput.files[0];
//     const fileContent = await file.text();
//     const jsonData = JSON.parse(fileContent);
//     const startDate = new Date(startDateTime);
//     const endDate = new Date(endDateTime);

//     const filteredData = jsonData.filter(entry => {
//         const entryDateTime = new Date(entry.timestamp); // Assuming the JSON has a timestamp field
//         return entryDateTime >= startDate && entryDateTime <= endDate;
//     });

//     if (filteredData.length === 0) {
//         alert("No data found for the selected date and time range.");
//         return;
//     }

//     const timestamps = filteredData.map(entry => new Date(entry.timestamp));
//     const throughputValues = filteredData.map(entry => entry.throughput);

//     // Plot graph using Plotly
//     const trace = {
//         x: timestamps,
//         y: throughputValues,
//         type: "scatter",
//         mode: "lines+markers",
//         marker: { color: "green" },
//         name: "Throughput"
//     };

//     const layout = {
//         title: "Throughput Logs Over Time",
//         xaxis: { title: "Timestamp" },
//         yaxis: { title: "Throughput" }
//     };

//     Plotly.newPlot("graph-container", [trace], layout);
// }

// function handleFolderInput(event) {
//     const files = event.target.files;
//     const throughputFiles = [];
//     const agentErrorFiles = [];
//     const fmsTaskFiles = [];

//     for (const file of files) {
//         if (file.name.includes('throughputData') && file.name.endsWith('.json')) {
//             throughputFiles.push(file);
//         } else if (file.name.includes('agentErrors') && file.name.endsWith('.json')) {
//             agentErrorFiles.push(file);
//         } else if (file.name.includes('fmsTask') && file.name.endsWith('.json')) {
//             fmsTaskFiles.push(file);
//         }
//     }

//     console.log('Throughput Files:', throughputFiles);
//     console.log('Agent Error Files:', agentErrorFiles);
//     console.log('FMS Task Files:', fmsTaskFiles);

//     // Process the files as needed
//     processFiles(throughputFiles, agentErrorFiles, fmsTaskFiles);
// }

// function processFiles(throughputFiles, agentErrorFiles, fmsTaskFiles) {
//     const startDateTime = new Date(document.getElementById('start-datetime').value);
//     const endDateTime = new Date(document.getElementById('end-datetime').value);

//     // Example processing function for throughput files
//     throughputFiles.forEach(file => {
//         const reader = new FileReader();
//         reader.onload = function (event) {
//             const jsonData = JSON.parse(event.target.result);
//             const filteredData = jsonData.filter(entry => {
//                 const entryDateTime = new Date(entry.timestamp); // Assuming the JSON has a timestamp field
//                 return entryDateTime >= startDateTime && entryDateTime <= endDateTime;
//             });
//             console.log('Filtered Throughput Data:', filteredData);
//             plotThroughputData(filteredData);
//         };
//         reader.readAsText(file);
//     });

//     // Example processing function for agent error files
//     agentErrorFiles.forEach(file => {
//         const reader = new FileReader();
//         reader.onload = function (event) {
//             const jsonData = JSON.parse(event.target.result);
//             const filteredData = jsonData.filter(entry => {
//                 const entryDateTime = new Date(entry.timestamp); // Assuming the JSON has a timestamp field
//                 return entryDateTime >= startDateTime && entryDateTime <= endDateTime;
//             });
//             console.log('Filtered Agent Errors:', filteredData);
//             // Process filtered agent error data as needed
//         };
//         reader.readAsText(file);
//     });

//     // Example processing function for FMS task files
//     fmsTaskFiles.forEach(file => {
//         const reader = new FileReader();
//         reader.onload = function (event) {
//             const jsonData = JSON.parse(event.target.result);
//             const filteredData = jsonData.filter(entry => {
//                 const entryDateTime = new Date(entry.timestamp); // Assuming the JSON has a timestamp field
//                 return entryDateTime >= startDateTime && entryDateTime <= endDateTime;
//             });
//             console.log('Filtered FMS Task Data:', filteredData);
//             // Process filtered FMS task data as needed
//         };
//         reader.readAsText(file);
//     });
// }

// function plotThroughputData(data) {
//     const timestamps = data.map(entry => new Date(entry.timestamp));
//     const throughputValues = data.map(entry => entry.throughput);

//     const trace = {
//         x: timestamps,
//         y: throughputValues,
//         type: 'scatter',
//         mode: 'lines+markers',
//         marker: { color: 'green' },
//         name: 'Throughput'
//     };

//     const layout = {
//         title: 'Throughput Over Time',
//         xaxis: { title: 'Timestamp' },
//         yaxis: { title: 'Throughput' }
//     };

//     const graphContainer = document.getElementById('graph-container');
//     graphContainer.innerHTML = ''; // Clear previous chart
//     Plotly.newPlot(graphContainer, [trace], layout);
// }

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// function handleCheckboxChange(type) {
//     const checkboxes = document.querySelectorAll(`input[name="${type}"]:checked`);
//     const selectedValues = Array.from(checkboxes).map(cb => cb.value);
//     console.log(`Selected ${type}:`, selectedValues);

//     // Call the corresponding function based on the selected checkboxes
//     if (type === 'errors') {
//         filterAndPlotErrors();
//     } else if (type === 'tasks') {
//         plotTaskReport();
//     } else if (type === 'delays') {
//         processTaskDelayData();
//     } else if (type === 'plots') {
//         submitThroughputFilters();
//     }
// }

document.addEventListener("DOMContentLoaded", function () {
    const filters = ["errors", "tasks", "delays", "plots"];
    let selectedFiles = {};  // Global storage for files

    filters.forEach(filter => {
        document.querySelectorAll(`input[name='${filter}']`).forEach(checkbox => {
            checkbox.addEventListener("change", function () {
                handleCheckboxChange(filter);
            });
        });
    });

    document.getElementById("input-folder").addEventListener("change", function (event) {
        handleFileSelection(event);
    });
});

function handleCheckboxChange(filterType) {
    const allCheckbox = document.getElementById(`all-${filterType}`);
    const checkboxes = document.querySelectorAll(`input[name='${filterType}']:not(#all-${filterType})`);

    if (allCheckbox.checked) {
        checkboxes.forEach(cb => cb.checked = true);
    } else {
        const allChecked = [...checkboxes].every(cb => cb.checked);
        allCheckbox.checked = allChecked;
    }
    updateDisplay(filterType);
}

function updateDisplay(filterType) {
    const selected = [];
    document.querySelectorAll(`input[name='${filterType}']:checked`).forEach(checkbox => {
        if (checkbox.id !== `all-${filterType}`) {
            selected.push(checkbox.value);
        }
    });

    console.log(`Selected ${filterType}:`, selected);
    renderPlot(filterType, selected);
}

function renderPlot(filterType, selectedFilters) {
    if (filterType === "tasks") {
        processTaskData(selectedFilters);
    }
}

function processTaskData(selectedFilters) {
    const fmsTaskFileKey = Object.keys(selectedFiles).find(name => name.includes("fmsTask.json"));
    
    if (!fmsTaskFileKey) {
        console.error("Error: fmsTask.json not found in selected files.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
        try {
            const data = JSON.parse(event.target.result);
            let pickCount = 0, dropCount = 0, pickToDropCount = 0;
            let robotTaskCounts = {};

            data.forEach(task => {
                if (selectedFilters.includes("pick-tasks") && task.sourceLocation) {
                    pickCount++;
                }
                if (selectedFilters.includes("drop-tasks") && task.destinationLocation) {
                    dropCount++;
                }
                if (selectedFilters.includes("pick-to-drop-tasks") && task.sourceLocation && task.destinationLocation) {
                    pickToDropCount++;
                }
                if (selectedFilters.includes("tasks-by-robot")) {
                    robotTaskCounts[task.robotId] = (robotTaskCounts[task.robotId] || 0) + 1;
                }
            });

            displayTaskCounts(pickCount, dropCount, pickToDropCount, robotTaskCounts);
        } catch (error) {
            console.error("Error parsing task data:", error);
        }
    };
    reader.readAsText(selectedFiles[fmsTaskFileKey]);
}

function displayTaskCounts(pick, drop, pickToDrop, robots) {
    let output = `<p>Pick Tasks: ${pick}</p><p>Drop Tasks: ${drop}</p><p>Pick to Drop Tasks: ${pickToDrop}</p>`;
    output += `<p>Tasks by Each Robot:</p><ul>`;
    for (const robotId in robots) {
        output += `<li>Robot ${robotId}: ${robots[robotId]} tasks</li>`;
    }
    output += `</ul>`;

    let displayContainer = document.getElementById("display-container");
    if (!displayContainer) {
        displayContainer = document.createElement("div");
        displayContainer.id = "display-container";
        document.body.appendChild(displayContainer);
    }
    displayContainer.innerHTML = output;
}

function handleFileSelection(event) {
    const allowedSuffixes = ["agentErrors.json", "fmsTask.json", "throughputData.json"];
    const files = Array.from(event.target.files);

    files.forEach(file => {
        if (allowedSuffixes.some(suffix => file.name.endsWith(suffix))) {
            selectedFiles[file.name] = file; // Store reference correctly
        }
    });

    console.log("Filtered Files:", Object.keys(selectedFiles));
}

function submitAllReportsFilters() {
    console.log("Submit button clicked.");

    const fmsTaskFileKey = Object.keys(selectedFiles).find(name => name.includes("fmsTask.json"));

    if (!fmsTaskFileKey) {
        console.warn("No task data available to plot.");
        return;
    }

    renderPlot("tasks", ["pick-tasks", "drop-tasks", "pick-to-drop-tasks", "tasks-by-robot"]);
}


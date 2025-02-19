from flask import Flask, request, jsonify, render_template
import os
import json
import datetime
from werkzeug.utils import secure_filename

app = Flask(__name__)

# Set upload folder and allowed file extensions
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'json'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Check if file extension is allowed
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('index.html')

def categorize_json(json_data):
    """Categorizes JSON file based on its structure."""
    
    if any("errorCount" in entry for entry in json_data):
        return "error"
    
    elif any("throughput" in entry for entry in json_data):
        return "throughput"
    
    elif any("taskId" in entry for entry in json_data):
        return "task_delay"
    
    return "unknown"

@app.route("/upload", methods=["POST"])
def upload_files():
    """Handles file uploads and categorizes JSON files."""
    
    if "files" not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    uploaded_files = request.files.getlist("files")
    categorized_data = {"error": [], "throughput": [], "task_delay": []}
    
    for file in uploaded_files:
        if file.filename.endswith(".json"):
            file_content = json.load(file)
            category = categorize_json(file_content)
            
            if category in categorized_data:
                categorized_data[category].extend(file_content)
    
    return jsonify({"message": "Files processed successfully", "data": categorized_data})
   

@app.route('/submit_throughput_filters', methods=['POST'])
def submit_throughput_filters():
    start_datetime = request.form.get('throughput-start-datetime')
    end_datetime = request.form.get('throughput-end-datetime')
    json_file = request.files.get('throughput-json-file')

    if json_file and allowed_file(json_file.filename):
        filename = secure_filename(json_file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        json_file.save(file_path)

        # Process the JSON file and filters here

    return jsonify({'status': 'success', 'message': 'Throughput filters submitted successfully'})

@app.route('/submit_fleet_filters', methods=['POST'])
def submit_fleet_filters():
    start_datetime = request.form.get('fleet-start-datetime')
    end_datetime = request.form.get('fleet-end-datetime')
    json_file = request.files.get('fleet-json-file')

    if json_file and allowed_file(json_file.filename):
        filename = secure_filename(json_file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        json_file.save(file_path)

        # Process the JSON file and filters here

    return jsonify({'status': 'success', 'message': 'Fleet filters submitted successfully'})

@app.route('/submit_error_filters', methods=['POST'])
def submit_error_filters():
    robot_id = request.form.get('robot-id')
    error_type = request.form.get('error-type')
    start_time = request.form.get('error-start-time')
    end_time = request.form.get('error-end-time')
    json_file = request.files.get('json-file')

    if json_file and allowed_file(json_file.filename):
        filename = secure_filename(json_file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        json_file.save(file_path)

        # Process the error filters and JSON data here

    return jsonify({'status': 'success', 'message': 'Error filters submitted successfully'})

@app.route("/submit_task_filters", methods=["POST"])
def submit_task_filters():
    start_date = request.form.get("task-start-date")
    end_date = request.form.get("task-end-date")
    start_time = request.form.get("task-start-time") or "00:00"
    end_time = request.form.get("task-end-time") or "23:59"
    json_file = request.files.get("task-json-file")

    if not json_file or not allowed_file(json_file.filename):
        return jsonify({"status": "error", "message": "Invalid file format."}), 400

    filename = secure_filename(json_file.filename)
    file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
    json_file.save(file_path)

    try:
        with open(file_path, "r") as f:
            task_data = json.load(f)
    except Exception as e:
        return jsonify({"status": "error", "message": f"Error reading JSON: {str(e)}"}), 500

    # Apply filtering logic before returning data
    filtered_tasks = [task for task in task_data if start_date <= task["timestamp"]["$date"][:10] <= end_date]
    
    return jsonify({"status": "success", "filtered_tasks": filtered_tasks})

@app.route('/submit_loading_time_filters', methods=['POST'])
def submit_loading_time_filters():
    start_datetime_str = request.form.get('loading-start-datetime')
    end_datetime_str = request.form.get('loading-end-datetime')
    task_id = request.form.get('loading-task-id')
    json_file = request.files.get('loading-json-file')

    if not json_file or not allowed_file(json_file.filename):
        return jsonify({'status': 'error', 'message': 'Invalid file format'})

    # Save the file
    filename = secure_filename(json_file.filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    json_file.save(file_path)

    # Convert user input datetime strings to datetime objects
    start_datetime = datetime.datetime.strptime(start_datetime_str, "%Y-%m-%dT%H:%M")
    end_datetime = datetime.datetime.strptime(end_datetime_str, "%Y-%m-%dT%H:%M")

    # Load JSON data
    with open(file_path, 'r') as f:
        data = json.load(f)

    loading_times = []

    for task in data:
        try:
            recv_time = datetime.datetime.strptime(task['RecvTime'], "%Y:%m:%d %H:%M:%S.%f")
            pick_time = datetime.datetime.strptime(task['PickTime'], "%Y:%m:%d %H:%M:%S.%f")

            # Check if the task falls within the user-selected date-time range
            if start_datetime <= recv_time <= end_datetime:
                loading_time = (pick_time - recv_time).total_seconds() / 60  # Convert to minutes
                loading_times.append(loading_time)

        except Exception as e:
            print(f"Skipping task {task.get('taskId', 'Unknown')} due to error: {e}")

    if not loading_times:
        return jsonify({'status': 'error', 'message': 'No valid data found for the given date range'})

    # Generate histogram plot
    plt.figure(figsize=(8, 5))
    plt.hist(loading_times, bins=10, color='blue', alpha=0.7, edgecolor='black')
    plt.xlabel('Loading Time (minutes)')
    plt.ylabel('Number of Tasks')
    plt.title('Loading Time Distribution')
    plt.grid(axis='y', linestyle='--', alpha=0.7)

    # Save plot to a BytesIO object
    img_io = io.BytesIO()
    plt.savefig(img_io, format='png')
    img_io.seek(0)

    return send_file(img_io, mimetype='image/png')

@app.route('/submit_task_delay_filters', methods=['POST'])
def submit_task_delay_filters():
    start_datetime = request.form.get('delay-start-datetime')
    end_datetime = request.form.get('delay-end-datetime')
    task_id = request.form.get('delay-task-id')
    json_file = request.files.get('delay-json-file')

    if not json_file or not allowed_file(json_file.filename):
        return jsonify({'status': 'error', 'message': 'Invalid file format'}), 400

    # Save uploaded file
    filename = secure_filename(json_file.filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    json_file.save(file_path)

    # Load JSON data
    with open(file_path, 'r') as file:
        task_data = json.load(file)

    # Convert start and end datetime to proper format
    start_datetime = parse_datetime(start_datetime) if start_datetime else None
    end_datetime = parse_datetime(end_datetime) if end_datetime else None

    task_delays = []

    for task in task_data:
        pick_time = parse_datetime(task.get("PickTime"))
        rap_time = parse_datetime(task.get("RAPTime"))

        if not pick_time or not rap_time:
            continue  # Skip invalid entries

        task_delay = (pick_time - rap_time).total_seconds() / 60  # Convert to minutes

        # Apply filters
        if start_datetime and pick_time < start_datetime:
            continue
        if end_datetime and pick_time > end_datetime:
            continue
        if task_id and str(task.get("taskId")) != task_id:
            continue

        task_delays.append(task_delay)

    if not task_delays:
        return jsonify({'status': 'error', 'message': 'No tasks match the filter criteria'}), 400

    avg_delay = sum(task_delays) / len(task_delays)

    # Plot the delays
    plt.figure(figsize=(8, 5))
    plt.hist(task_delays, bins=10, color='blue', edgecolor='black', alpha=0.7)
    plt.axvline(avg_delay, color='red', linestyle='dashed', linewidth=2, label=f'Avg Delay: {avg_delay:.2f} min')
    plt.xlabel("Task Delay (minutes)")
    plt.ylabel("Frequency")
    plt.title("Task Delay Distribution")
    plt.legend()

    plot_path = os.path.join(app.config['UPLOAD_FOLDER'], 'task_delay_plot.png')
    plt.savefig(plot_path)
    plt.close()

    return send_file(plot_path, mimetype='image/png')

@app.route('/submit_task_cycle_filters', methods=['POST'])
def submit_task_cycle_filters():
    start_datetime_str = request.form.get('cycle-start-datetime')
    end_datetime_str = request.form.get('cycle-end-datetime')
    task_id = request.form.get('cycle-task-id')
    json_file = request.files.get('cycle-json-file')

    if not json_file or not allowed_file(json_file.filename):
        return jsonify({'status': 'error', 'message': 'Invalid file format'})

    # Save the file
    filename = secure_filename(json_file.filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    json_file.save(file_path)

    # Convert input datetime strings to datetime objects
    start_datetime = datetime.datetime.strptime(start_datetime_str, "%Y-%m-%dT%H:%M")
    end_datetime = datetime.datetime.strptime(end_datetime_str, "%Y-%m-%dT%H:%M")

    # Load JSON data
    with open(file_path, 'r') as f:
        data = json.load(f)

    cycle_times = []

    for task in data:
        try:
            pick_time = datetime.datetime.strptime(task['PickTime'], "%Y:%m:%d %H:%M:%S.%f")
            completed_time = datetime.datetime.strptime(task['CompletedTime'], "%Y:%m:%d %H:%M:%S.%f")

            # Check if the task falls within the user-selected date-time range
            if start_datetime <= pick_time <= end_datetime:
                task_cycle_time = (completed_time - pick_time).total_seconds() / 60  # Convert to minutes
                cycle_times.append(task_cycle_time)

        except Exception as e:
            print(f"Skipping task {task.get('taskId', 'Unknown')} due to error: {e}")

    if not cycle_times:
        return jsonify({'status': 'error', 'message': 'No valid data found for the given date range'})

    # Generate histogram plot
    plt.figure(figsize=(8, 5))
    plt.hist(cycle_times, bins=10, color='green', alpha=0.7, edgecolor='black')
    plt.xlabel('Task Cycle Time (minutes)')
    plt.ylabel('Number of Tasks')
    plt.title('Task Cycle Time Distribution')
    plt.grid(axis='y', linestyle='--', alpha=0.7)

    # Save plot to a BytesIO object
    img_io = io.BytesIO()
    plt.savefig(img_io, format='png')
    img_io.seek(0)

    return send_file(img_io, mimetype='image/png')

if __name__ == '__main__':
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
    app.run(debug=True)

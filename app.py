from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import datetime
import pandas as pd
import json
import matplotlib.pyplot as plt
import io
import matplotlib
matplotlib.use('Agg')
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)  # Allow all origins (for testing)

# Set upload folder and allowed file extensions
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'json'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Check if file extension is allowed
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS



@app.route('/submit_all_reports_filters', methods=['POST'])
def submit_all_reports_filters():
    start_datetime = request.form.get('start-datetime')
    end_datetime = request.form.get('end-datetime')
    input_folder = request.files.getlist('input-folder')

    # Check for input folder files
    uploaded_files = []
    for file in input_folder:
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            uploaded_files.append(file_path)

    # Your logic to process filters and uploaded files

    return jsonify({'status': 'success', 'message': 'Filters submitted successfully'})

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

        with open(file_path, 'r') as f:
            error_data = json.load(f)

        df = pd.DataFrame(error_data)

        # Convert timestamps if present
        if 'lastModifiedDate' in df:
            df['lastModifiedDate'] = pd.to_datetime(df['lastModifiedDate']['$date'])

        # Filtering by user inputs
        if robot_id:
            df = df[df['robotId'] == int(robot_id)]
        if error_type and error_type != "all":
            df = df[df['errorCode'] == int(error_type)]
        if start_time and end_time:
            df = df[(df['lastModifiedDate'] >= start_time) & (df['lastModifiedDate'] <= end_time)]

        # Plot 1: Errors by Error Code
        plt.figure(figsize=(8, 6))
        sns.countplot(x=df['errorCode'], palette='coolwarm')
        plt.xlabel('Error Code')
        plt.ylabel('Count')
        plt.title('Error Frequency by Error Code')
        plt.xticks(rotation=45)
        plt.savefig('static/error_by_code.png')

        # Plot 2: Errors by Robot ID
        plt.figure(figsize=(8, 6))
        sns.countplot(x=df['robotId'], palette='viridis')
        plt.xlabel('Robot ID')
        plt.ylabel('Count')
        plt.title('Error Frequency by Robot ID')
        plt.savefig('static/error_by_robot.png')

        # Plot 3: Heatmap of Errors (Error Code vs Robot ID)
        plt.figure(figsize=(8, 6))
        heatmap_data = df.groupby(['robotId', 'errorCode']).size().unstack(fill_value=0)
        sns.heatmap(heatmap_data, annot=True, cmap='coolwarm', fmt='d')
        plt.xlabel('Error Code')
        plt.ylabel('Robot ID')
        plt.title('Error Distribution')
        plt.savefig('static/error_heatmap.png')

        # Plot 4: Error Position Scatter Plot
        if 'errorPosition' in df.columns:
            df[['x', 'y']] = df['errorPosition'].apply(lambda pos: pd.Series([pos.get('x', None), pos.get('y', None)]))
            plt.figure(figsize=(8, 6))
            sns.scatterplot(x=df['x'], y=df['y'], hue=df['errorCode'], palette='tab10', alpha=0.7)
            plt.xlabel('X Position')
            plt.ylabel('Y Position')
            plt.title('Error Location Scatter Plot')
            plt.savefig('static/error_position.png')

        return jsonify({'status': 'success', 'message': 'Error filters applied', 'plots': [
            'static/error_by_code.png',
            'static/error_by_robot.png',
            'static/error_heatmap.png',
            'static/error_position.png'
        ]})

    return jsonify({'status': 'error', 'message': 'Invalid file or input'})

@app.route("/submit_task_filters", methods=["POST"])
def submit_task_filters():
    try:
        # Get form data
        start_date = request.form.get("task-start-date")
        end_date = request.form.get("task-end-date")
        start_time = request.form.get("task-start-time")
        end_time = request.form.get("task-end-time")
        json_file = request.files.get("task-json-file")

        # Validate inputs
        if not json_file or not allowed_file(json_file.filename):
            return jsonify({"status": "error", "message": "Invalid file format. Upload a JSON file."}), 400

        # Secure and save file
        filename = secure_filename(json_file.filename)
        file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        json_file.save(file_path)

        # Convert start and end datetime
        try:
            start_datetime = datetime.datetime.strptime(f"{start_date} {start_time}", "%Y-%m-%d %H:%M")
            end_datetime = datetime.datetime.strptime(f"{end_date} {end_time}", "%Y-%m-%d %H:%M")
        except ValueError:
            return jsonify({"status": "error", "message": "Invalid date format. Use YYYY-MM-DD HH:MM."}), 400

        # Read JSON file
        data = pd.read_json(file_path)

        # Check if required columns exist
        required_columns = {"PickTime", "sourceLocation", "destinationLocation", "robotId"}
        if not required_columns.issubset(data.columns):
            return jsonify({"status": "error", "message": "Missing required columns in JSON file."}), 400

        # Fix PickTime format and convert to datetime
        data["PickTime"] = data["PickTime"].str.replace(r"(\d{4}):(\d{2}):(\d{2})", r"\1-\2-\3", regex=True)
        data["PickTime"] = pd.to_datetime(data["PickTime"], format="%Y-%m-%d %H:%M:%S.%f", errors="coerce")
        data.dropna(subset=["PickTime"], inplace=True)

        # Filter data
        df_filtered = data[(data["PickTime"] >= start_datetime) & (data["PickTime"] <= end_datetime)]
        if df_filtered.empty:
            return jsonify({"status": "error", "message": "No matching data found for the selected filters."}), 404

        # Generate plots
        fig, axes = plt.subplots(2, 2, figsize=(12, 10))

        # Source Tasks
        df_filtered["sourceLocation"].value_counts().plot(kind="bar", ax=axes[0, 0], color="blue", alpha=0.7)
        axes[0, 0].set_title("Source Tasks")

        # Destination Tasks
        df_filtered["destinationLocation"].value_counts().plot(kind="bar", ax=axes[0, 1], color="red", alpha=0.7)
        axes[0, 1].set_title("Destination Tasks")

        # Source to Destination
        df_filtered.groupby(["sourceLocation", "destinationLocation"]).size().unstack().plot(
            kind="bar", stacked=True, ax=axes[1, 0], colormap="viridis"
        )
        axes[1, 0].set_title("Source to Destination Tasks")

        # Robot Tasks
        df_filtered["robotId"].value_counts().plot(kind="bar", ax=axes[1, 1], color="green", alpha=0.7)
        axes[1, 1].set_title("Tasks by Robot ID")

        plt.tight_layout()

        # Convert plot to image and return as response
        img_io = io.BytesIO()
        plt.savefig(img_io, format="png")
        img_io.seek(0)
        plt.close()  # Prevents memory leaks
        return send_file(img_io, mimetype="image/png")

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

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

from flask import Flask, jsonify, request
import subprocess
import os
import psutil
import logging
import socket
from flask_cors import CORS
import time  # Required for free_port_and_close_terminal

app = Flask(__name__)
CORS(app)
processes = {}  # Store as {'app_name': (PID, port)}

# Setup logging
logging.basicConfig(filename='controller_app.log', level=logging.DEBUG,
                    format='%(asctime)s - %(levelname)s - %(message)s')


import logging

def check_port(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        result = sock.connect_ex(("localhost", port))
        if result == 0:  # Port is occupied
            if port == 5001:
                return port, "occupied", " App Controller Pro"
            
            # Find the app name based on the port from the processes dictionary
            app_info = next((name for name, (_, p) in processes.items() if p == port), "Unknown App")
            
            # Loop through active connections to find the correct process
            for conn in psutil.net_connections(kind='inet'):
                if conn.laddr.port == port:  # Check if the local address port matches
                    try:
                        process = psutil.Process(conn.pid)
                        return port, "occupied", app_info, process.name()  # Return app name and process name
                    except psutil.NoSuchProcess:
                        return port, "occupied", app_info, "Unknown Process"  # Fallback if process isn't found
            return port, "occupied", app_info, "Unknown Process"  # Fallback if no connection matches
        else:
            return port, "available", None  # No process associated if available




@app.route('/check_specific_port', methods=['GET'])
def check_specific_port():
    port = request.args.get("port")
    if not port:
        logging.error("Missing required parameter: port.")
        return jsonify({"error": "Missing required parameter: port"}), 400

    try:
        port = int(port)
    except ValueError:
        logging.error("Invalid port number provided.")
        return jsonify({"error": "Invalid port number provided"}), 400
    
    status = check_port(port)
    running_apps = [
            {"app_name": name, "port": port, "pid": process}
            for name, (process, port) in processes.items()
        ]
    # Check if the app is running on the specified port
    for app in running_apps:
        if int(app['port']) == port:
            # Update the status with the app name from running_apps
            logging.info(f"Checked status of port {app['app_name']}.")
            status = (status[0], status[1], app['app_name'], status[3])  # Update the app_name in status tuple
    
    logging.info(f"Checked status of port {port}.")
    return jsonify({port: status}), 200





def free_port_and_close_terminal(pid):
    try:
        # Retrieve process by PID
        main_process = psutil.Process(pid)
        print(f"Main process with PID {main_process.pid} found for termination.")

        # Terminate all child processes
        def terminate_process_tree(proc):
            for child in proc.children(recursive=True):
                try:
                    print(f"Terminating child process: PID {child.pid} ({child.name()})")
                    child.terminate()
                    child.wait(timeout=3)
                except psutil.NoSuchProcess:
                    pass
                except psutil.TimeoutExpired:
                    print(f"Force killing child process: PID {child.pid}")
                    child.kill()

            try:
                print(f"Terminating main process: PID {proc.pid} ({proc.name()})")
                proc.terminate()
                proc.wait(timeout=3)
            except psutil.NoSuchProcess:
                pass
            except psutil.TimeoutExpired:
                print(f"Force killing main process: PID {proc.pid}")
                proc.kill()

        # Terminate the process tree
        terminate_process_tree(main_process)
        return {"status": f"Process {pid} successfully terminated."}, 200

    except psutil.NoSuchProcess:
        print(f"Process with PID {pid} no longer exists.")
        return {"error": f"Process with PID {pid} no longer exists."}, 404

@app.route('/start_app', methods=['POST'])
def start_app():
    try:
        data = request.json
        app_name = data.get("app_name")
        script_path = data.get("script_path")
        environment_path = data.get("environment_path")
        port_number = data.get("port_number")
        
        if not app_name or not script_path or not environment_path or not port_number:
            logging.error("Missing required parameters for starting the app.")
            return jsonify({"error": "Missing required parameters: app_name, script_path, environment_path, and port_number"}), 400

        if app_name in processes:
            logging.warning(f"Attempted to start '{app_name}', which is already running.")
            return jsonify({"error": f"{app_name} is already running"}), 400

        if not os.path.isfile(script_path):
            logging.error(f"Script path '{script_path}' does not exist.")
            return jsonify({"error": f"Script path '{script_path}' does not exist"}), 400
        if not os.path.isdir(environment_path):
            logging.error(f"Environment path '{environment_path}' does not exist.")
            return jsonify({"error": f"Environment path '{environment_path}' does not exist"}), 400

        command = f'{environment_path}\\Scripts\\activate && python {script_path} --port={port_number}'
        process = subprocess.Popen(command, shell=True)
        processes[app_name] = (process.pid, port_number)  # Store PID and port
        logging.info(f"Started app '{app_name}' on port {port_number} with PID {process.pid}.")
        return jsonify({"status": f"{app_name} started on port {port_number}"}), 200

    except Exception as e:
        logging.exception("Exception occurred while trying to start an app.")
        return jsonify({"error": "Failed to start the application due to an internal error."}), 500

@app.route('/stop_app', methods=['POST'])
def stop_app():
    data = request.json
    app_name = data.get("app_name")

    if not app_name:
        return jsonify({"error": "Missing required parameter: app_name"}), 400

    if app_name not in processes:
        return jsonify({"error": f"{app_name} is not running"}), 400

    # Retrieve the PID associated with the app and attempt to terminate it
    pid, port_number = processes.pop(app_name)
    result, status_code = free_port_and_close_terminal(pid)
    logging.info(f"Stopped app '{app_name}' on port {port_number}.")
    return jsonify(result), status_code

@app.route('/status', methods=['GET'])
def status():
    try:
        # Build a detailed list with app name, port, and process ID
        running_apps = [
            {"app_name": name, "port": port, "pid": process}
            for name, (process, port) in processes.items()
        ]
        
        logging.info("Retrieved status of running applications.")
        return jsonify({"running_apps": running_apps}), 200

    except Exception as e:
        logging.exception("Exception occurred while retrieving application status.")
        return jsonify({"error": "Failed to retrieve the status due to an internal error."}), 500



if __name__ == '__main__':
    app.run(port=5001)

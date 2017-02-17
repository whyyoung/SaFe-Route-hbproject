import os
import sys
import json

from flask import Flask, request, render_template, jsonify
import jinja2


app = Flask(__name__)

google_maps_key=os.environ['GOOGLE_MAPS_ACCESS_TOKEN']
data_set_key=os.environ['DATA_ACCESS_TOKEN']

# Required to use Flask sessions and the debug toolbar
app.secret_key = "secretSECRETseekrit"

@app.route('/')
def index():
    """Show map.html template."""

    return render_template("map.html",
    	api_key=google_maps_key,
    	data_key=data_set_key)

# @app.route('/turn-locations.json')
# def lat_lng_bounds():

# 	step_start_point = request.args.get("startBoundary")
# 	step_start_point = json.loads(step_start_point)
# 	step_remaining_points = request.args.get("boundaryPoints")
# 	step_remaining_points = json.loads(step_remaining_points)

# 	steps_list = [step_start_point]

# 	for step in step_remaining_points:
# 		step = json.loads(step)
# 		steps_list.append(step)
	
# 	# print steps_list, type(steps_list[-1])

# 	boundary_coordinates = {}

# 	i = 0

# 	while i < len(steps_list):
# 		x = steps_list[i]
# 		boundary_coordinates[i] = [("lat" : (float(x.get("lat")) + (0.015)), 
# 			(float(x.get("lng")) + (0.015))),
# 			((float(x.get("lat")) + (0.015)), 
# 			(float(x.get("lng")) - (0.015))),
# 			((float(x.get("lat")) - (0.015)), 
# 			(float(x.get("lng")) - (0.015))),
# 			((float(x.get("lat")) - (0.015)), 
# 			(float(x.get("lng")) + (0.015)))]
# 		i += 1

# 	return jsonify(boundary_coordinates)


if __name__ == '__main__':
    # debug=True gives us error messages in the browser and also "reloads" our web app
    # if we change the code.
    app.run(debug=True, host="0.0.0.0")


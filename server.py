import os
import sys

from flask import Flask, request, render_template
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

@app.route('/turn-locations.json')
def lat_lng_bounds():
	step_start_point = request.args.get("startBoundary")
	step_remaining_points = request.args.get("boundaryPoints")

	url_format = {}
	# url_format[coordinate[0]] = [step_start_point[lng], step_start_point[lat]]

	print step_start_point
	
	# i = 1
	
	# for coordinate in step_remaining_points:
	# 	url_format[coordinate[i]] = 
	# print step_start_points
	# print step_end_points
	return "Yay!"


if __name__ == '__main__':
    # debug=True gives us error messages in the browser and also "reloads" our web app
    # if we change the code.
    app.run(debug=True, host="0.0.0.0")


import os
import sys
import json
import jinja2
import datetime
from flask import Flask, request, render_template, jsonify, redirect, session
from model import Crime, connect_to_db, db, DataSearch, RouteSearch


app = Flask(__name__)

google_maps_key=os.environ['GOOGLE_MAPS_ACCESS_TOKEN']
data_set_key=os.environ['DATA_ACCESS_TOKEN']

# Required to use Flask sessions and the debug toolbar
app.secret_key = "secretSECRETseekrit"

@app.route('/')
def index():
    """Show map.html template."""

    return render_template("map.html")

@app.route('/store-searches.json', methods=["POST"])
def store_searches():
	data = request.get_json()

	walking_routes = data["routes"]
	starting_location = data["start"]
	ending_location = data["end"]
	request_date_time = data["datestamp"]


	route_search = RouteSearch(starting_location=starting_location,
							ending_location=ending_location,
							walking_routes=walking_routes,
							request_date_time=request_date_time)
	db.session.add(route_search)
	db.session.commit()
	return "OK"

@app.route('/data-map')
def show_map():

	return render_template("data-map.html")

# Takes user input from data-map.html/js to query and filter results from 'crimes' database.
# Returns rows to data-map.js to populate map markers and info windows.
@app.route('/data-map.json')
def get_filtered_data():

	district = request.args.get("district")
	time = request.args.get("time")
	day = request.args.get("day")
	category = request.args.get("category")

	# Add user filters to database of stored data searches.
	data_search = DataSearch(district=district,
							time=time,
							day=day,
							category=category)
	db.session.add(data_search)
	db.session.commit()

	district_filter = []
	category_filter = []
	day_filter = []

	if district is not None:
		district = district.split(",")
		for d in district:
			district_filter.append(d.upper())

	if category is not None:
		category = category.split(",")
		category_filter = combine_category(category)

	if day == "all":
		day_filter = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
	else:
		day_filter.append(day.title())

	if time == "all":
		time = ['00:00', '24:00']
	else:
		time = time_filter(time)

	query_results = db.session.query(Crime).filter(Crime.PdDistrict.in_((district_filter)) &
											Crime.Category.in_((category_filter)) &
											Crime.Day_of_Week.in_((day_filter)) &
											(time[0] < Crime.Time) &
											(Crime.Time <= time[1])) 

	query_results = query_results.order_by('Date').all()
	query_results = query_results[-50:]

	results = {}

	for entry in query_results:
		results[entry.PdId] = {"latitude": entry.Y,
								"longitude": entry.X,
								"category": entry.Category,
								"date": entry.Date,
								"time": entry.Time,
								"address": entry.Address,
								"description": entry.Description}

	# json_results = json.dumps(query_results)

	return jsonify(results)

# Passes time frames to SQL query.
def time_filter(timeframe):
	time_dict = {"0-3": ['00:00', '03:00'],
				"3-6": ['03:00', '06:00'],
				"6-9": ['06:00', '09:00'],
				"9-12": ['09:00', '12:00'],
				"12-15": ['12:00', '15:00'],
				"15-18": ['15:00', '18:00'],
				"18-21": ['18:00', '21:00'],
				"21-0": ['21:00', '24:00']}
	
	return time_dict[timeframe]

# Combines categories to pass to SQL query.
def combine_category(category):

	category_filter = []

	for c in category:
		if c == "sex":
			category_filter.extend(("SEX OFFENSES, NON FORCIBLE", "SEX OFFENSES, FORCIBLE",
									"PROSTITUION", "PORNOGRAPHY/OBSCENE MAT"))
		elif c == "theft":
			category_filter.extend(("VEHICLE THEFT", "LARCENY/THEFT", "STOLEN PROPERTY"))
		elif c == "trespassing":
			category_filter.extend(("SUSPICIOUS OCC", "LOITERING", "TRESPASS", "TREA"))
		elif c == "vandalism":
			category_filter.extend(("VANDALISM", "ARSON"))
		elif c == "fraud":
			category_filter.extend(("EMBEZZLEMENT", "FORGERY/COUNTERFEITING", "FRAUD", "BAD CHECKS"))
		elif c == "bribery":
			category_filter.extend(("EXTORTION", "BRIBERY"))
		elif c == "alcohol":
			category_filter.extend(("DRIVING UNDER THE INFLUENCE", "LIQUOR LAWS"))
		elif c == "weapon":
			category_filter.append("WEAPON LAWS")
		elif c == "secondary":
			category_filter.append("SECONDARY CODES")
		elif c == "disorder":
			category_filter.extend(("DISORDERLY CONDUCT", "DRUNKENNESS"))
		elif c == "misc":
			category_filter.extend(("RECOVERED VEHICLE", "OTHER OFFENSES", "SUICIDE", "FAMILY OFFENSES",
									"WARRANTS", "RUNAWAY", "MISSING PERSON", "GAMBLING"))
		else:
			category_filter.append(c.upper())

	return category_filter


if __name__ == '__main__':
    # debug=True gives us error messages in the browser and also "reloads" our web app
    # if we change the code.
    connect_to_db(app)
    app.run(debug=True, host="0.0.0.0", port=5000)
    


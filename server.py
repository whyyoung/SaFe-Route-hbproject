import os
import sys
import json
import jinja2
import datetime
from flask import Flask, request, render_template, jsonify, redirect, session
from model import Crime, connect_to_db, db
from sqlalchemy import and_, Date, Time, cast


app = Flask(__name__)

google_maps_key=os.environ['GOOGLE_MAPS_ACCESS_TOKEN']
data_set_key=os.environ['DATA_ACCESS_TOKEN']

# Required to use Flask sessions and the debug toolbar
app.secret_key = "secretSECRETseekrit"

@app.route('/')
def index():
    """Show map.html template."""

    return render_template("map.html")

@app.route('/data-map')
def show_map():

	return render_template("data-map.html")

@app.route('/data-map.json')
def get_filtered_data():

	district = request.args.get("district")
	time = request.args.get("time")
	day = request.args.get("day")
	category = request.args.get("category")

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

	day_filter.append(day.title())

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

def combine_category(category):

	category_filter = []

	for c in category:
		if c == "sex":
			category_filter.append("SEX OFFENSES, NON FORCIBLE")
			category_filter.append("SEX OFFENSES, FORCIBLE")
			category_filter.append("PROSTITUION")
			category_filter.append("PORNOGRAPHY/OBSCENE MAT")
		elif c == "theft":
			category_filter.append("VEHICLE THEFT")
			category_filter.append("LARCENY/THEFT")
			category_filter.append("STOLEN PROPERTY")
		elif c == "trespassing":
			category_filter.append("SUSPICIOUS OCC")
			category_filter.append("LOITERING")
			category_filter.append("TRESPASS")
			category_filter.append("TREA")
		elif c == "vandalism":
			category_filter.append("VANDALISM")
			category_filter.append("ARSON")
		elif c == "fraud":
			category_filter.append("EMBEZZLEMENT")
			category_filter.append("FORGERY/COUNTERFEITING")
			category_filter.append("FRAUD")
			category_filter.append("BAD CHECKS")
		elif c == "bribery":
			category_filter.append("EXTORTION")
			category_filter.append("BRIBERY")
		elif c == "alcohol":
			category_filter.append("DRIVING UNDER THE INFLUENCE")
			category_filter.append("LIQUOR LAWS")
		elif c == "weapon":
			category_filter.append("WEAPON LAWS")
		elif c == "secondary":
			category_filter.append("SECONDARY CODES")
		elif c == "disorder":
			category_filter.append("DISORDERLY CONDUCT")
			category_filter.append("DRUNKENNESS")
		elif c == "misc":
			category_filter.append("RECOVERED VEHICLE")
			category_filter.append("OTHER OFFENSES")
			category_filter.append("SUICIDE")
			category_filter.append("FAMILY OFFENSES")
			category_filter.append("WARRANTS")
			category_filter.append("RUNAWAY")
			category_filter.append("MISSING PERSON")
			category_filter.append("GAMBLING")
		else:
			category_filter.append(c.upper())

	return category_filter


if __name__ == '__main__':
    # debug=True gives us error messages in the browser and also "reloads" our web app
    # if we change the code.
    connect_to_db(app)
    app.run(debug=True, host="0.0.0.0", port=5000)
    


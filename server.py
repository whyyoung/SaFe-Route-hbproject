import os
import sys
import json
import jinja2
import datetime
from lyft_rides.auth import ClientCredentialGrant
from lyft_rides.session import Session
from lyft_rides.client import LyftRidesClient
from lyft_rides.auth import AuthorizationCodeGrant

from collections import OrderedDict

# from lyft_rides.auth import refresh_access_token
# from lyft_rides.auth import revoke_access_token
# from lyft_rides.request import Request
# from lyft_rides.utils import auth
from flask import Flask, request, render_template, jsonify, redirect, session
from model import Crime, connect_to_db, db, DataSearch, RouteSearch

app = Flask(__name__)

google_maps_key=os.environ['GOOGLE_MAPS_ACCESS_TOKEN']
data_set_key=os.environ['DATA_ACCESS_TOKEN']
lyft_client_id=os.environ['LYFT_CLIENT_ID']
lyft_client_token=os.environ['LYFT_CLIENT_TOKEN']
lyft_client_secret=os.environ['LYFT_CLIENT_SECRET']

# Required to use Flask sessions and the debug toolbar
app.secret_key = "secretSECRETseekrit"

@app.route('/')
def index():
    """Show map.html template."""

    return render_template("home.html")

@app.route('/directions')
def directions_page():
	start = request.args.get("start-address")
	end = request.args.get("end-address")

	print start, end

	return render_template("map.html",
							start=start,
							end=end)

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

@app.route('/get_lyft_info', methods=["POST"])
def lyft_info_request():
	start_address = request.form.get("startAddress")
	end_address = request.form.get("endAddress")
	start_lat = request.form.get("start_lat")
	start_lng = request.form.get("start_lng")
	end_lat = request.form.get("end_lat")
	end_lng = request.form.get("end_lng")

	# auth_flow = AuthorizationCodeGrant(
	#     lyft_client_id,
	#     lyft_client_secret,
	#     ["public","rides.request"],
	#     sandbox_mode=True,
	# )
	# auth_url = auth_flow.get_authorization_url()

	auth_flow = ClientCredentialGrant(client_id=lyft_client_id, client_secret=lyft_client_secret, scopes=["public","rides.read"])
	session = auth_flow.get_session()

	client = LyftRidesClient(session)
	response = client.get_ride_types(37.7833, -122.4167)
	ride_types = response.json.get('ride_types')

	eta_response = client.get_pickup_time_estimates(latitude=float(start_lat), longitude=float(start_lng))
	pickup_eta = eta_response.json.get('eta_estimates')
	return_dict = {}

	i_eta = 0
	while i_eta < len(pickup_eta):
		if pickup_eta[i_eta]["ride_type"] == 'lyft':
			return_dict["ride_type"] = pickup_eta[i_eta]["ride_type"],
			return_dict["display_name"] = pickup_eta[i_eta]["display_name"],
			return_dict["eta_seconds"] = pickup_eta[i_eta]["eta_seconds"]
		i_eta += 1

	cost_response = client.get_cost_estimates(start_latitude=float(start_lat),
											start_longitude=float(start_lng),
											end_latitude=float(end_lat),
											end_longitude=float(end_lng))
	cost_estimates = cost_response.json.get('cost_estimates')

	i_cost = 0
	while i_cost < len(cost_estimates):
		if cost_estimates[i_cost]["ride_type"] == 'lyft':
			return_dict["estimated_cost_cents_max"] = cost_estimates[i_cost]["estimated_cost_cents_max"]
			return_dict["estimated_cost_cents_min"] = cost_estimates[i_cost]["estimated_cost_cents_min"]
			return_dict["primetime_confirmation_token"] = cost_estimates[i_cost]["primetime_confirmation_token"]
		i_cost += 1

	print pickup_eta, cost_estimates

	return jsonify(return_dict)

# @app.route('/lyft-request', methods=["POST"])
# def lyft_request():
# 	auth_flow = AuthorizationCodeGrant(
#     lyft_client_id,
#     lyft_client_secret,
#     ["public", "rides.read", "rides.request", "offline"])

# 	auth_url = auth_flow.get_authorization_url()
# 	session = auth_flow.get_session(redirect_url)
# 	client = LyftRidesClient(session)
# 	credentials = session.oauth2credential

# 	response = client.request_ride(
# 	    ride_type='lyft',
# 	    start_latitude=37.77,
# 	    start_longitude=-122.41,
# 	    end_latitude=37.79,
# 	    end_longitude=-122.41,
# 	)
# 	ride_details = response.json
# 	ride_id = ride_details.get('ride_id')

if __name__ == '__main__':
    # debug=True gives us error messages in the browser and also "reloads" our web app
    # if we change the code.
    connect_to_db(app)
    app.run(debug=True, host="0.0.0.0", port=5000)
    


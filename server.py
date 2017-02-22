import os
import sys
import json
import jinja2
from flask import Flask, request, render_template, jsonify, redirect, session
from model import Crime, connect_to_db, db


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

    print district

    district_filter = []
    category_filter = []

    if district is not None:
    	district = district.split(",")
    	i = 0
    	for d in district:
    		if i == 0:
    			district_filter.append("(Crime.PdDistrict == '" + d.upper() + "')")
    			i += 1
    		else:
    			district_filter.append(" | (Crime.PdDistrict == '" + d.upper() + "')")

    results = db.session.query(Crime).filter(Crime.PdDistrict.in_((district)))

    print results.first()
    # results = results.order_by('Date').all()

    # print results[-50:]

    return "yay!"




if __name__ == '__main__':
    # debug=True gives us error messages in the browser and also "reloads" our web app
    # if we change the code.
    connect_to_db(app)
    app.run(debug=True, host="0.0.0.0", port=5000)
    


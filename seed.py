
"""Utility file to seed crimes database using SFPD_Incidents_-_from_1_January_2003
 in seed_data/"""

from sqlalchemy import func
from model import Crime
from model import connect_to_db, db
from server import app

from datetime import datetime

def load_crimes():
    """Load crime reports from SFPD_Incidents_-_from_1_January_2003 into database."""
    def date_conversion(datestring):
        try: 
            date_object = datetime.strptime(datestring, '%m/%d/%Y').date()
            return date_object
        except ValueError:
            return

    def time_conversion(timestring):
        try: 
            time_object = datetime.strptime(timestring, '%H:%M').time()
            return time_object
        except ValueError:
            return

    print "Crimes"

    # Delete all rows in table, so if we need to run this a second time,
    # we won't be trying to add duplicate users
    # Crime.query.delete()

    # Read u.user file and insert data

    def remove_commas():
        with open("seed_data/2_weeks_data--assault.csv") as csvfile:
            data = csv.reader(csvfile, skipinitialspace=True)
            for row in data:
                return row

    data_set = remove_commas

    for line in csv.reader([data], skipinitialspace=True):
        print line

    for row in open("seed_data/2_weeks_data--assault.csv"):
        crime_list = row.split(',')
        print crime_list

        # has_header

        if not crime_list[0]=="IncidntNum":
        	print type(crime_list[4])
        	print type(date_conversion(crime_list[4]))

#     >>> import csv
# >>> teststring = '48, "one, two", "2011/11/03"'
# >>> for line in csv.reader([teststring], skipinitialspace=True):
#     print line


['48', 'one, two', '2011/11/03']


	   #      crime = Crime(category=crime_list[1],
	   #                  description=crime_list[2],
	   #                  day_of_week=crime_list[3],
	   #                  date=date_conversion(crime_list[4]),
	   #                  time=time_conversion(crime_list[5]),
	   #                  address=crime_list[8],
	   #                  latitude=crime_list[9],
	   #                  longitude=crime_list[10])

	   #      # We need to add to the session or it won't ever be stored
	   #      db.session.add(crime)

    # # Once we're done, we should commit our work
    # db.session.commit()


if __name__ == "__main__":
    connect_to_db(app)

    # In case tables haven't been created, create them
    db.create_all()

    # Import different types of data
    load_crimes()
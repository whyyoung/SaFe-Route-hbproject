from flask_sqlalchemy import SQLAlchemy

# This is the connection to the PostgreSQL database; we're getting this through
# the Flask-SQLAlchemy helper library. On this, we can find the `session`
# object, where we do most of our interactions (like committing, etc.)

db = SQLAlchemy()


##############################################################################
# Model definitions

class Crime(db.Model):
    """Crime Report data for San Francisco from January 1, 2003."""

    __tablename__ = "crimes"

    IncidntNum = db.Column(db.Integer)
    Category = db.Column(db.String(100), nullable=False)
    Description = db.Column(db.String(1000), nullable=False)
    Day_of_Week = db.Column(db.String(20), nullable=False)
    Date = db.Column(db.String(20), nullable=False)
    Time = db.Column(db.String(20), nullable=False)
    PdDistrict = db.Column(db.String(100))
    Resolution = db.Column(db.String(1000))
    Address = db.Column(db.String(1000), nullable=False)
    X = db.Column(db.String(20), nullable=False)
    Y = db.Column(db.String(20), nullable=False)
    Location = db.Column(db.String(100))
    PdId = db.Column(db.String(50), primary_key=True)

    def __repr__(self):
        """Provide helpful representation when printed."""

        return "<Crime Category=%s Date=%s Time=%s Address=%s>" % (self.Category,
                self.Date, self.Time, self.Address)

class RouteSearch(db.Model):
    """Stores searches, directions and alternative route information."""

    __tablename__ = "route_searches"

    id = db.Column(db.Integer, autoincrement=True, primary_key=True)
    starting_location = db.Column(db.String(200))
    ending_location = db.Column(db.String(200))
    walking_routes = db.Column(db.PickleType())
    request_date_time = db.Column(db.DateTime)
    lyft_requested = db.Column(db.Boolean, default=False)
    lyft_request_filled = db.Column(db.Boolean, default=False)
    lyft_access_token = db.Column(db.String(1500))

    def __repr__(self):
        """Provide helpful representation when printed."""

        return "<Starting Location=%s Ending Location=%s>" % (self.starting_location,
                self.ending_location)

class DataSearch(db.Model):
    """Stores user filters of data."""

    __tablename__ = "data_searches"

    id = db.Column(db.Integer, autoincrement=True, primary_key=True)
    category = db.Column(db.String(2000))
    day = db.Column(db.String(20))
    time = db.Column(db.String(100))
    district = db.Column(db.String(2000))

    def __repr__(self):
        """Provide helpful representation when printed."""

        return "<Search Category=%s Day=%s Time=%s District=%s>" % (self.category,
                self.day, self.time, self.district)

##############################################################################
# Helper functions

def connect_to_db(app):
    """Connect the database to our Flask app."""

    # Configure to use our PstgreSQL database
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql:///crimes'
    # app.config['SQLALCHEMY_ECHO'] = True
    db.app = app
    db.init_app(app)

##############################################################################
# Testing data

def example_data():
    """Create some sample data."""

    # In case this is run more than once, empty out existing data
#     Crime.query.delete()
    RouteSearch.query.delete()
    DataSearch.query.delete()


#     ca1 = crime(dept_code='fin', dept='Finance', phone='555-1000')
#     ca2 = crime(dept_code='legal', dept='Legal', phone='555-2222')
#     ca3 = crime(dept_code='mktg', dept='Marketing', phone='555-9999')

    # Add searches
    r1 = RouteSearch(starting_location='683 Sutter Street', ending_location='transbay terminal')
    r2 = RouteSearch(starting_location='595 Market Street', ending_location='3 Embarcadero')
    r3 = RouteSearch(starting_location='Mission Pie', ending_location='2550 Mission Street')

    d1 = DataSearch(category='assault', day='friday', time='21-0', district='mission,tenderloin')
    d2 = DataSearch(category='vandalism', day='all', time='all', district='central')
    d3 = DataSearch(category='kidnapping', day='monday', time='all', district='tenderloin')

    db.session.add_all([r1, r2, r3, d1, d2, d3])
    db.session.commit()


if __name__ == "__main__":
    # As a convenience, if we run this module interactively, it will leave
    # you in a state of being able to work with the database directly.

    from server import app
    connect_to_db(app)
    # db.create_all()
    print "Connected to DB."
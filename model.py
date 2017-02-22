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

##############################################################################
# Helper functions

def connect_to_db(app):
    """Connect the database to our Flask app."""

    # Configure to use our PstgreSQL database
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql:///crimes'
    # app.config['SQLALCHEMY_ECHO'] = True
    db.app = app
    db.init_app(app)


if __name__ == "__main__":
    # As a convenience, if we run this module interactively, it will leave
    # you in a state of being able to work with the database directly.

    from server import app
    connect_to_db(app)
    # db.create_all()
    print "Connected to DB."
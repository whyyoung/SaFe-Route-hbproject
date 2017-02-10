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

    id = db.Column(db.Integer, autoincrement=True, primary_key=True)
    category = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(1000), nullable=False)
    day_of_week = db.Column(db.String(20), nullable=False)
    date = db.Column(db.DateTime, nullable=False)
    time = db.Column(db.DateTime, nullable=False)
    address = db.Column(db.String(500), nullable=False)
    latitude = db.Column(db.String(20), nullable=False)
    longitude = db.Column(db.String(20), nullable=False) 

    def __repr__(self):
        """Provide helpful representation when printed."""

        return "<Crime Category=%s Date=%s Time=%s Address=%s>" % (self.category,
                self.date, self.time, self.address)

##############################################################################
# Helper functions

def connect_to_db(app):
    """Connect the database to our Flask app."""

    # Configure to use our PstgreSQL database
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql:///crimes'
    db.app = app
    db.init_app(app)


if __name__ == "__main__":
    # As a convenience, if we run this module interactively, it will leave
    # you in a state of being able to work with the database directly.

    from server import app
    connect_to_db(app)
    print "Connected to DB."
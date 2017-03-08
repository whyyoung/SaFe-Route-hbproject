from server import app
import server
import unittest
from model import DataSearch, RouteSearch, connect_to_db, db, example_data

class MyAppIntegrationTestCase(unittest.TestCase):
    """Integration tests: Testing Flask server."""

    def setUp(self):
        print "(setUp ran)"
        self.client = server.app.test_client()
        server.app.config['TESTING'] = True

    def test_index(self):
        result = self.client.get('/')
        self.assertIn('<h1>SaFe Route</h1>', result.data)

    def test_store_searches(self):
    	result = self.client.get('/data-map')
        self.assertIn('<h4>Category:</h4>', result.data)

class FlaskTests(unittest.TestCase):
    def setUp(self):
        """Stuff to do before every test."""
        # Get the Flask test client
        self.client = app.test_client()

        # Show Flask errors that happen during tests
        app.config['TESTING'] = True

        # Connect to test database
        connect_to_db(app)

        # Create tables and add sample data
        db.create_all()
        example_data()

    def tearDown(self):
        """Do at end of every test."""

        db.session.close()
        db.drop_all()

    def test_find_data_search(self):
        """Can we find a data filter search on assault?"""

        result = DataSearch.query.filter(DataSearch.category == "assault").first()
        self.assertEqual(result.category, "assault")

    def test_find_route_search(self):
        """Can we find a route search that originated at 683 sutter street"""

        result = RouteSearch.query.filter(RouteSearch.starting_location == "683 Sutter Street").first()

        self.assertEqual(result.starting_location, "683 Sutter Street")

if __name__ == '__main__':
    # If called like a script, run our tests
    unittest.main()
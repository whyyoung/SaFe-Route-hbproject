import server
import unittest

class MyAppIntegrationTestCase(unittest.TestCase):
    """Integration tests: Testing Flask server."""

    def setUp(self):
        print "(setUp ran)"
        self.client = server.app.test_client()
        server.app.config['TESTING'] = True

    def test_index(self):
        result = self.client.get('/')
        self.assertIn('<h1>SaFe Route</h1>', result.data)

# KeyError: 'SQLALCHEMY_TRACK_MODIFICATIONS'
    def test_directions_page(self):
        result = self.client.get('/directions')
        self.assertIn('<h3>Legend</h3>', result.data)

    def test_store_searches(self):
    	result = self.client.get('/data-map')
        self.assertIn('<h4>Category:</h4>', result.data)

if __name__ == '__main__':
    # If called like a script, run our tests
    unittest.main()
import json
from datetime import datetime
from collections import defaultdict

# Load the JSON data
with open('your-file-here.json', 'r') as file:
    data = json.load(file)

# Initialize a dictionary to store the counts
connections_by_year_month = defaultdict(lambda: defaultdict(int))

# Iterate through the connections
for connection in data['content']:
    created_at_timestamp = connection.get('created_at')
    if created_at_timestamp:
        # Convert timestamp to datetime
        created_date = datetime.fromtimestamp(created_at_timestamp / 1000)  # Convert ms to seconds
        year = created_date.year
        month = created_date.strftime('%B')  # Get month name
        connections_by_year_month[year][month] += 1

# Print the results
for year, months in sorted(connections_by_year_month.items()):
    print(f"\nYear: {year}")
    for month, count in sorted(months.items()):
        print(f"  {month}: {count} connections")
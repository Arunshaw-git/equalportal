import requests 

api_url = "https://equalportal.onrender.com/postsscrape"
response = requests.get(api_url)

if response.status_code == 200:
    posts= response.json()
    print(posts)
else:
    print("Failed to get post: ", response.status_code)
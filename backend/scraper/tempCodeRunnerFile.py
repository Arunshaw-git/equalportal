import requests 
from serpapi import GoogleSearch

def matched_links():
    api_url = "https://equalportal.onrender.com/postsscrape"
    response = requests.get(api_url)
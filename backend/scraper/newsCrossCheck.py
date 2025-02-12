import requests 
from serpapi import GoogleSearch

def matched_links():
    api_url = "https://equalportal.onrender.com/postsscrape"
    response = requests.get(api_url)

    if response.status_code == 200:
        posts= response.json()
        print(posts)
    else:
        print("Failed to get post: ", response.status_code)

    def trimming(posts):
        trimmed_desc =[]
        words =["is", "are", "have", "they", "the", "of", "to"]

        for i in range(len(posts)):
            desc = posts[i]["title"]
            desc_words = desc.split()

            filtered_desc = ' '.join(word for word in desc_words if word not in words)
            trimmed_desc.append(filtered_desc)
            print("#############")
            print(trimmed_desc)

        return trimmed_desc

    def search_google(trimmed_desc):
        params = {
            "q": trimmed_desc,
            "api_key": "701f2e32f2fea1813b49c367b06eb0b2bc0e0af823be49e4d6874cf1d2eb7734"
        }
        search = GoogleSearch(params)
        data = search.get_dict()
        return data.get("organic_results", [])

    trimmed = trimming(posts)

    all_links = []
    for i in range(len(trimmed)):
        results = search_google(trimmed[i])
        if results:
            all_links.append(results[0]['link'])
        
    return all_links


print(matched_links())

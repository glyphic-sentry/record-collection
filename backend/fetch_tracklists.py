import json
import time
import requests

DISCOGS_TOKEN = "YOUR_DISCOGS_TOKEN"

def fetch_tracklist(release_id):
    url = f"https://api.discogs.com/releases/{release_id}"
    headers = {
        "User-Agent": "record-collection-app/1.0",
        "Authorization": f"Discogs token={DISCOGS_TOKEN}",
    }
    response = requests.get(url, headers=headers)
    # If we exceed the rate limit, raise an HTTPError so the caller can handle it
    response.raise_for_status()
    data = response.json()
    return [track.get("title") for track in data.get("tracklist", [])]

def main():
    with open("collection.json", "r") as f:
        albums = json.load(f)

    for album in albums:
        # Only fetch if there's no tracklist or it's empty
        if not album.get("tracklist"):
            release_id = album["id"]
            retries = 0
            while retries < 3:
                try:
                    album["tracklist"] = fetch_tracklist(release_id)
                    print(f"Fetched {len(album['tracklist'])} tracks for {album['title']}")
                    break  # Success, break out of retry loop
                except requests.exceptions.HTTPError as e:
                    if e.response.status_code == 429:
                        # Too many requests: respect Retry-After header if present, else sleep 60s
                        retry_after = int(e.response.headers.get("Retry-After", "60"))
                        wait_time = max(retry_after, 5)
                        print(
                            f"Rate limit hit (429) while fetching {release_id}, "
                            f"sleeping for {wait_time} seconds..."
                        )
                        time.sleep(wait_time)
                        retries += 1
                        continue
                    else:
                        # Other HTTP errors should be logged and break
                        print(f"Failed to fetch tracklist for {release_id}: {e}")
                        break
                except Exception as e:
                    print(f"Unexpected error fetching {release_id}: {e}")
                    break
            # Always sleep 1 second between attempts to avoid hitting the rate limit too quickly
            time.sleep(1)

    with open("collection.json", "w") as f:
        json.dump(albums, f, indent=2)

if __name__ == "__main__":
    main()

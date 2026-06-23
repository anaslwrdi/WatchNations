import json
import math
import sys


def normalize(value):
    return str(value or "").lower().strip()


def score_channel(channel, query):
    query = normalize(query)
    haystack = normalize(
        " ".join(
            [
                channel.get("name", ""),
                channel.get("group", ""),
                channel.get("quality", ""),
            ]
        )
    )

    if not query:
        return 1.0 + (0.1 if ".m3u8" in normalize(channel.get("url")) else 0)

    score = 0.0
    if haystack == query:
        score += 100
    if haystack.startswith(query):
        score += 55
    if query in haystack:
        score += 30

    terms = [term for term in query.split() if term]
    if terms:
        overlap = sum(1 for term in terms if term in haystack)
        score += 20 * (overlap / math.sqrt(len(terms)))

    if ".m3u8" in normalize(channel.get("url")):
        score += 3

    return score


def main():
    payload = json.load(sys.stdin)
    channels = payload.get("channels", [])
    query = payload.get("query", "")

    ranked = [
        {**channel, "_score": score_channel(channel, query)}
        for channel in channels
    ]
    ranked = [channel for channel in ranked if channel["_score"] > 0]
    ranked.sort(key=lambda item: (-item["_score"], normalize(item.get("name"))))

    groups = sorted({channel.get("group", "general") for channel in ranked if channel.get("group")})
    json.dump(
        {
            "channels": ranked[:120],
            "insight": f"Python AI ranked {len(ranked)} channels across {len(groups) or 1} groups",
        },
        sys.stdout,
        ensure_ascii=False,
    )


if __name__ == "__main__":
    main()

"""Recompute AlphaSignal observations from the saved public-data projections."""

import collections
import json
import pathlib
import statistics

ROOT = pathlib.Path(__file__).parent


def read(name):
    return json.loads((ROOT / name).read_text())


def descending(items, field):
    return all(a[field] >= b[field] for a, b in zip(items, items[1:]))


queries = read("feed-observations.json")["queries"]
latest = queries["latest"]["items"]
three_days = queries["upvotes-3d"]["items"] + queries["upvotes-3d-page2"]["items"]
trending = queries["trending"]["items"]
editions = read("edition-observations.json")
digests = [edition for edition in editions if edition["kind"] == "weekday digest"]
leads = [item for edition in digests for item in edition["leads"]]
organic = [item for edition in digests for item in edition["signals"] if not item["paid_insert"]]
same_unit_editions = [
    edition for edition in digests
    if {item["display_metric"] for item in edition["signals"] if not item["paid_insert"]} == {"Likes"}
]
taxonomy = read("taxonomy.json")["topics"]
windows = read("window-experiments.json")
result = {
    "latest_count": len(latest),
    "latest_order_descending": descending(latest, "publish_time"),
    "three_day_count": len(three_days),
    "three_day_counts_descending": descending(three_days, "upvotes"),
    "trending_equals_three_day_top_50": [x["_id"] for x in trending] == [x["_id"] for x in three_days[:50]],
    "three_day_content_types": dict(collections.Counter(x["content_type"] for x in three_days)),
    "issues": len(editions),
    "weekday_issues": len(digests),
    "all_weekdays_have_three_leads_six_signals": all(len(x["leads"]) == 3 and len(x["signals"]) == 6 for x in digests),
    "all_weekday_leads_descend": all(descending(x["leads"], "display_metric_value") for x in digests),
    "all_weekday_signal_slot_two_paid": all(x["signals"][1]["paid_insert"] for x in digests),
    "lead_count": len(leads),
    "lead_body_words_min_median_max": [min(x["body_words"] for x in leads), statistics.median(x["body_words"] for x in leads), max(x["body_words"] for x in leads)],
    "organic_signal_count": len(organic),
    "organic_signal_words_min_median_max": [min(x["headline_words"] for x in organic), statistics.median(x["headline_words"] for x in organic), max(x["headline_words"] for x in organic)],
    "editions_all_organic_signals_use_likes": len(same_unit_editions),
    "same_unit_editions_with_descending_signals": sum(descending([x for x in edition["signals"] if not x["paid_insert"]], "display_metric_value") for edition in same_unit_editions),
    "signal_slot_three_arxiv": sum(x["signals"][2]["source_host"] == "arxiv.org" for x in digests),
    "signal_slot_four_arxiv": sum(x["signals"][3]["source_host"] == "arxiv.org" for x in digests),
    "signal_slot_five_huggingface": sum(x["signals"][4]["source_host"] == "huggingface.co" for x in digests),
    "topics": len(taxonomy),
    "parent_qualified_subtopics": sum(len(x["subtopics"]) for x in taxonomy),
    "robotics_before_after_count": [len(windows[key]["items"]) for key in ["robotics-widening-false", "robotics-widening-true"]],
    "robotics_new_timeframe": windows["robotics-widening-true"]["metadata"]["new_timeframe"],
    "retrieval_before_after_count": [len(windows[key]["items"]) for key in ["widening-false", "widening-true"]],
}
print(json.dumps(result, indent=2))

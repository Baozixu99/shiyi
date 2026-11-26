# -*- coding: utf-8 -*-
# 调试：复现 V4 调用，打印模型原始输出（检查 quote 字段形态）
import json, re, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
S = json.loads((ROOT / "secrets.local.json").read_text(encoding="utf-8"))
BASE = S["baseUrl"].rstrip("/")
MODEL = S.get("model", "deepseek-v4.1-flash")

def post(url, payload, headers, timeout=120):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))

# 1) 抓取公众号文章（与 proxy /api/fetch 相同逻辑）
fetch_payload = {"url": "https://mp.weixin.qq.com/s/-hTFhi7_5KJk6VTXp1_2Wg"}
f = post("http://127.0.0.1:8743/api/fetch", fetch_payload, {"Content-Type": "application/json"})
article = f["text"]; paras = f.get("paragraphs") or []
# 2) 与 buildBlocks 相同的规则
raw, blocks, total = [], [], 0
src = paras if paras else None
if src:
    for p in src:
        t = p.strip()
        if len(t) < 15: continue
        raw.append(t[:700] if len(t) > 700 else t)
        if len(raw) >= 80: break
else:
    for i in range(0, len(article), 280):
        t = article[i:i+280].strip()
        if len(t) >= 15: raw.append(t)
        if len(raw) >= 80: break
for t in raw:
    if total + len(t) > 22000: break
    total += len(t)
    blocks.append({"id": "b%d" % (len(blocks)+1), "text": t})

# 3) V4 提示词（从 api.js 提取）
js = (ROOT / "shiyi-prototype" / "api.js").read_text(encoding="utf-8")
m = re.search(r"const AI_SYSTEM_PROMPT_V4 = \[([\s\S]*?)\]\.join", js)
lines = re.findall(r"'((?:[^'\\]|\\.)*)'", m.group(1))
system = "".join(x.encode().decode("unicode_escape") for x in lines)

# 4) 调用（goal 留空）
payload = {"model": MODEL, "messages": [
    {"role": "system", "content": system},
    {"role": "user", "content": json.dumps({"goal": None, "coverage": "partial", "blocks": blocks}, ensure_ascii=False)},
], "temperature": 0.4, "stream": False}
resp = post(BASE + "/chat/completions", payload, {"Authorization": "Bearer " + S["apiKey"], "Content-Type": "application/json"})
content = resp["choices"][0]["message"]["content"]
print(content[:2600])

import json
import random
from tqdm import tqdm

# 1. 基础数据定义
models = [
    "Boeing 737-800", "ARJ21-700", "Boeing 747-8", "Airbus A380-800",
    "Boeing 777-300ER", "Airbus A321XLR", "Embraer E190-E2", "Bombardier CRJ900",
    "Airbus A350-900", "Boeing 787-9", "Comac C919"
]

# 映射细分机型 (Sub-model)，用于增加专业性展示
sub_model_map = {
    "Boeing 737-800": "B737-8AS",
    "ARJ21-700": "ARJ21-700STD",
    "Boeing 747-8": "B747-89L",
    "Airbus A380-800": "A380-841",
    "Boeing 777-300ER": "B777-36NER",
    "Airbus A321XLR": "A321-253NY",
    "Embraer E190-E2": "ERJ-190-300 STD",
    "Bombardier CRJ900": "CL-600-2D24",
    "Airbus A350-900": "A350-941",
    "Boeing 787-9": "B787-9 Dreamliner",
    "Comac C919": "C919-100",
}

# 备注模板池
remarks_pool = [
    "Stunning landing during golden hour on runway {rwy}.",
    "Taxing to gate {gate} after a long-haul flight.",
    "Special livery detail captured at {airport}.",
    "Beautiful rotation shot with clear blue sky.",
    "Heavy aircraft rotating from runway {rwy} for departure.",
    "Rare visitor at {airport} today.",
    "Maintenance check completed, ready for the next flight."
]

airlines = [
    "China Southern Airlines", "China Eastern Airlines", "Air China", "Hainan Airlines", 
    "Cathay Pacific", "Emirates", "Singapore Airlines", "Qatar Airways", 
    "Lufthansa", "British Airways", "American Airlines", "Delta Air Lines", 
    "Japan Airlines", "Korean Air", "Turkish Airlines"
]

airports = ["SIN", "XSP", "QPG"]
camera_ids = ["C1", "C2"]
lens_ids = ["L1", "L2", "L3"]

data = []
count = 200000  # 定义生成数量

# 2. 数据生成循环
for i in tqdm(range(1, count + 1), desc="Generating data"):
    model = random.choices(models, weights=[5, 10, 3, 8, 15, 2, 1, 1, 4, 2, 3], k=1)[0]
    airline = random.choices(airlines, weights=[10, 10, 15, 5, 8, 12, 7, 6, 4, 3, 5, 5, 2, 2, 6], k=1)[0]
    airport = random.choices(airports, weights=[50, 30, 20], k=1)[0]
    
    # 提取细分机型
    sub_model = sub_model_map.get(model, "Standard")
    
    # 生成随机备注
    remark = random.choice(remarks_pool).format(
        rwy=random.choice(["02L", "02R", "20L", "20R", "15", "33"]),
        gate=random.randint(1, 150),
        airport=airport
    )

    # 日期生成逻辑
    year = random.randint(2025, 2026) # 修正为更近的时间线
    month = random.randint(1, 12)
    if month in {1, 3, 5, 7, 8, 10, 12}:
        day = random.randint(1, 31)
    elif month in {4, 6, 9, 11}:
        day = random.randint(1, 30)
    else:
        day = random.randint(1, 28)

    entry = {
        "id": i,
        "reg": f"B-{random.randint(1000, 9999)}",
        "model": model,
        "sub_model": sub_model,  # 新增字段
        "remarks": remark,        # 新增字段
        "airline": airline,
        "airport": airport,
        "camera_id": random.choice(camera_ids),
        "lens_id": random.choice(lens_ids),
        "src": f"https://picsum.photos/seed/{i}/800/533", # 使用 3:2 比例图片
        "date": f"{year}-{month:02d}-{day:02d}",
        "featured": random.choice([True] + [False] * 9) # 降低精选概率
    }
    data.append(entry)

# 3. 写入文件
with open('data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"已生成包含 {len(data)} 条数据的 data.json")
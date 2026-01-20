import json
import random
from tqdm import tqdm

# 定义一些基础数据用于随机组合
models = [
    "Airbus A350-941", "Boeing 787-9 Dreamliner", "COMAC C919", "Airbus A320-251N", 
    "Boeing 737-800", "ARJ21-700", "Boeing 747-8", "Airbus A380-800", 
    "Boeing 777-300ER", "Airbus A321XLR", "Embraer E195-E2", "Bombardier CRJ900"
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

for i in tqdm(range(1, 10000), desc="Generating data"):
    model = random.choices(models, weights=[5, 10, 3, 8, 15, 2, 1, 1, 4, 2, 3, 1], k=1)[0]
    airline = random.choices(airlines, weights=[10, 10, 15, 5, 8, 12, 7, 6, 4, 3, 5, 5, 2, 2, 6], k=1)[0]
    airport = random.choices(airports, weights=[50, 30, 20], k=1)[0]
    camera_id = random.choice(camera_ids)
    lens_id = random.choice(lens_ids)

    # 模拟数据对象
    year = random.randint(2025, 2030)
    month = random.randint(1, 12)
    if month in {1, 3, 5, 7, 8, 10, 12}:
        day = random.randint(1, 31)
    elif month in {4, 6, 9, 11}:
        day = random.randint(1, 30)
    else:  # February
        day = random.randint(1, 28)

    entry = {
        "id": i,
        "reg": f"B-{random.randint(1000, 9999)}",
        "model": model,
        "airline": airline,
        "airport": airport,
        "camera_id": camera_id,
        "lens_id": lens_id,
        "src": f"https://picsum.photos/seed/{i}/600/400",  # 使用占位图服务，每张图根据 ID 不同
        "date": f"{year:02d}-{month:02d}-{day:02d}",
        "featured": random.choice([True, False])
    }
    data.append(entry)

# 写入文件
with open('data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("已生成包含 200 条数据的 data.json")
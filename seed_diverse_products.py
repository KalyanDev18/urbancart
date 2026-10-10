import os
import django
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'urbancart.settings')
django.setup()

from store.models import Product

UNIQUE_PRODUCTS = [
    # --- CLOTHING & APPAREL ---
    {
        "name": "Oversized Acid Wash Streetwear Hoodie",
        "description": "Heavyweight 450gsm organic cotton fleece with vintage acid wash finish.",
        "price": Decimal("2799.00"),
        "category": "Clothing",
        "image_url": "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80",
        "stock": 35,
        "rating": Decimal("4.9")
    },
    {
        "name": "Vintage Japanese Graphic Crewneck Tee",
        "description": "100% combed Pima cotton with Japanese kanji typography graphic print.",
        "price": Decimal("899.00"),
        "category": "Clothing",
        "image_url": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
        "stock": 50,
        "rating": Decimal("4.8")
    },
    {
        "name": "Classic Washed Indigo Denim Trucker Jacket",
        "description": "Rugged 14oz raw denim jacket with antique brass hardware.",
        "price": Decimal("3999.00"),
        "category": "Clothing",
        "image_url": "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80",
        "stock": 20,
        "rating": Decimal("4.7")
    },
    {
        "name": "Techwear Tactical Cargo Joggers",
        "description": "Water-repellent stretch nylon with 6 utility pockets and ankle adjusters.",
        "price": Decimal("2999.00"),
        "category": "Clothing",
        "image_url": "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80",
        "stock": 28,
        "rating": Decimal("4.9")
    },
    {
        "name": "Cuban Collar Tropical Resort Shirt",
        "description": "Lightweight breathable rayon fabric with relaxed resort collar design.",
        "price": Decimal("1499.00"),
        "category": "Clothing",
        "image_url": "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80",
        "stock": 40,
        "rating": Decimal("4.6")
    },
    {
        "name": "Urban Padded Down Puffer Jacket",
        "description": "Windproof thermal puffer jacket engineered for extreme cold weather.",
        "price": Decimal("5499.00"),
        "category": "Clothing",
        "image_url": "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=800&q=80",
        "stock": 15,
        "rating": Decimal("4.9")
    },
    {
        "name": "Slim Fit Stretch Cotton Chino Trousers",
        "description": "Modern slim tailored chinos made with 4-way stretch flex cotton.",
        "price": Decimal("1899.00"),
        "category": "Clothing",
        "image_url": "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80",
        "stock": 45,
        "rating": Decimal("4.7")
    },
    {
        "name": "Corduroy Button-Down Overshirt",
        "description": "Soft ribbed corduroy shirt jacket suitable for autumn layering.",
        "price": Decimal("2299.00"),
        "category": "Clothing",
        "image_url": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80",
        "stock": 30,
        "rating": Decimal("4.8")
    },
    {
        "name": "Merino Wool Ribbed Cable Knit Sweater",
        "description": "Premium 100% extrafine merino wool cable knit pullover.",
        "price": Decimal("3499.00"),
        "category": "Clothing",
        "image_url": "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&q=80",
        "stock": 22,
        "rating": Decimal("4.9")
    },
    {
        "name": "Athletic Dry-Fit Training Performance Tee",
        "description": "Moisture-wicking mesh fabric engineered for high-intensity gym workouts.",
        "price": Decimal("799.00"),
        "category": "Clothing",
        "image_url": "https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80",
        "stock": 60,
        "rating": Decimal("4.6")
    },
    {
        "name": "Oversized Streetwear Bomber Jacket",
        "description": "Satin finish MA-1 military flight bomber with heavy duty orange lining.",
        "price": Decimal("4299.00"),
        "category": "Clothing",
        "image_url": "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80",
        "stock": 18,
        "rating": Decimal("4.8")
    },
    {
        "name": "Minimalist Fleece Sweatpants",
        "description": "Heavyweight French terry joggers with elastic drawstring waistband.",
        "price": Decimal("1699.00"),
        "category": "Clothing",
        "image_url": "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=800&q=80",
        "stock": 38,
        "rating": Decimal("4.7")
    },
    {
        "name": "Retro Tie-Dye Oversized Hoodie",
        "description": "Hand-dyed vibrant cloud pattern hoodie with fleece interior.",
        "price": Decimal("2599.00"),
        "category": "Clothing",
        "image_url": "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=800&q=80",
        "stock": 25,
        "rating": Decimal("4.7")
    },
    {
        "name": "Distressed Slim Fit Biker Denim Jeans",
        "description": "Italian stretch denim with natural fading and ribbed knee panels.",
        "price": Decimal("2999.00"),
        "category": "Clothing",
        "image_url": "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80",
        "stock": 27,
        "rating": Decimal("4.8")
    },
    {
        "name": "Pure Linen Casual Button-Up Shirt",
        "description": "Breathable 100% organic linen shirt for summer comfort.",
        "price": Decimal("1999.00"),
        "category": "Clothing",
        "image_url": "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80",
        "stock": 32,
        "rating": Decimal("4.6")
    },

    # --- FOOTWEAR & SNEAKERS ---
    {
        "name": "Urban Low-Top Calfskin Leather Sneakers",
        "description": "Handcrafted full-grain Italian leather sneakers with memory foam insoles.",
        "price": Decimal("4999.00"),
        "category": "Footwear",
        "image_url": "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80",
        "stock": 30,
        "rating": Decimal("4.9")
    },
    {
        "name": "Retro High-Top Court Basketball Sneakers",
        "description": "90s heritage high-top basketball shoes with ankle support padding.",
        "price": Decimal("5999.00"),
        "category": "Footwear",
        "image_url": "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80",
        "stock": 25,
        "rating": Decimal("4.8")
    },
    {
        "name": "Ultra-Lightweight Mesh Running Trainers",
        "description": "Breathable flyknit upper with responsive nitrogen-infused foam midsole.",
        "price": Decimal("3499.00"),
        "category": "Footwear",
        "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
        "stock": 45,
        "rating": Decimal("4.9")
    },
    {
        "name": "Suede Leather Chelsea Ankle Boots",
        "description": "Hand-burnished suede chelsea boots with elastic side gores and rubber heel.",
        "price": Decimal("6499.00"),
        "category": "Footwear",
        "image_url": "https://images.unsplash.com/photo-1638247025967-b4e38f787b76?auto=format&fit=crop&w=800&q=80",
        "stock": 18,
        "rating": Decimal("4.8")
    },
    {
        "name": "Canvas Vulcanized Slip-On Skate Shoes",
        "description": "Durable heavy canvas slip-on shoes with waffle pattern grip outsole.",
        "price": Decimal("1899.00"),
        "category": "Footwear",
        "image_url": "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80",
        "stock": 50,
        "rating": Decimal("4.6")
    },
    {
        "name": "Waterproof Outdoor Trail Hiking Boots",
        "description": "Rugged nubuck leather boots with Gore-Tex waterproof lining and Vibram sole.",
        "price": Decimal("7999.00"),
        "category": "Footwear",
        "image_url": "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80",
        "stock": 16,
        "rating": Decimal("4.9")
    },
    {
        "name": "Chunky Platform Dad Sneakers",
        "description": "Bold multi-layered mesh and suede upper with chunky lightweight midsole.",
        "price": Decimal("4499.00"),
        "category": "Footwear",
        "image_url": "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80",
        "stock": 22,
        "rating": Decimal("4.7")
    },
    {
        "name": "Hand-Stitched Tan Leather Oxford Shoes",
        "description": "Classic formal Goodyear welted oxfords for weddings and executive wear.",
        "price": Decimal("6999.00"),
        "category": "Footwear",
        "image_url": "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=800&q=80",
        "stock": 14,
        "rating": Decimal("4.9")
    },
    {
        "name": "Molded Ergonomic Comfort Slide Sandals",
        "description": "Water-friendly EVA slides with arch support and cushioned footbed.",
        "price": Decimal("1299.00"),
        "category": "Footwear",
        "image_url": "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?auto=format&fit=crop&w=800&q=80",
        "stock": 60,
        "rating": Decimal("4.5")
    },
    {
        "name": "Firm Ground Performance Cleat Football Boots",
        "description": "Synthetic micro-textured upper for precision ball control on turf fields.",
        "price": Decimal("3999.00"),
        "category": "Footwear",
        "image_url": "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&w=800&q=80",
        "stock": 20,
        "rating": Decimal("4.8")
    },

    # --- ELECTRONICS & TECH ---
    {
        "name": "Aura Pulse ANC Wireless Headphones",
        "description": "Active Noise Cancellation with 40-hour battery life and spatial 3D audio.",
        "price": Decimal("14999.00"),
        "category": "Electronics",
        "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
        "stock": 25,
        "rating": Decimal("4.9")
    },
    {
        "name": "CyberDeck RGB Mechanical Keyboard",
        "description": "Hot-swappable PCB with custom factory-lubricated linear switches.",
        "price": Decimal("8999.00"),
        "category": "Electronics",
        "image_url": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",
        "stock": 30,
        "rating": Decimal("4.8")
    },
    {
        "name": "Spatial Audio True Wireless ANC Earbuds",
        "description": "Compact IPX7 waterproof wireless earbuds with wireless charging case.",
        "price": Decimal("4999.00"),
        "category": "Electronics",
        "image_url": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80",
        "stock": 40,
        "rating": Decimal("4.8")
    },
    {
        "name": "Ultra-HD 4K 60fps Action Camera",
        "description": "Dual screen waterproof action cam with 6-axis gyro stabilization.",
        "price": Decimal("12999.00"),
        "category": "Electronics",
        "image_url": "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80",
        "stock": 15,
        "rating": Decimal("4.7")
    },
    {
        "name": "Heavy Bass 30W Waterproof Bluetooth Speaker",
        "description": "360-degree surround sound outdoor speaker with RGB pulse lighting.",
        "price": Decimal("3999.00"),
        "category": "Electronics",
        "image_url": "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80",
        "stock": 35,
        "rating": Decimal("4.8")
    },
    {
        "name": "Precision 26K DPI Ergonomic Gaming Mouse",
        "description": "Ultra-lightweight 58g wireless gaming mouse with optical switches.",
        "price": Decimal("3499.00"),
        "category": "Electronics",
        "image_url": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80",
        "stock": 28,
        "rating": Decimal("4.9")
    },
    {
        "name": "20000mAh 65W PD Fast Power Bank",
        "description": "Power Delivery fast charger capable of charging laptops and smartphones.",
        "price": Decimal("2499.00"),
        "category": "Electronics",
        "image_url": "https://images.unsplash.com/photo-1609592424074-9c025cf26d40?auto=format&fit=crop&w=800&q=80",
        "stock": 50,
        "rating": Decimal("4.7")
    },
    {
        "name": "Aluminum 9-in-1 USB-C Multiport Dock",
        "description": "4K 60Hz HDMI, Gigabit Ethernet, 100W PD charging & dual SD card slots.",
        "price": Decimal("2999.00"),
        "category": "Electronics",
        "image_url": "https://images.unsplash.com/photo-1544652478-6653e09f18a2?auto=format&fit=crop&w=800&q=80",
        "stock": 32,
        "rating": Decimal("4.8")
    },
    {
        "name": "Studio Condenser USB Microphone Kit",
        "description": "Professional 192kHz/24bit cardioid condenser mic with boom arm and pop filter.",
        "price": Decimal("4499.00"),
        "category": "Electronics",
        "image_url": "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80",
        "stock": 20,
        "rating": Decimal("4.9")
    },
    {
        "name": "15W Fast Qi Wireless Charging Stand",
        "description": "Dual coil wireless charging stand for smartphones and wireless earbuds.",
        "price": Decimal("1499.00"),
        "category": "Electronics",
        "image_url": "https://images.unsplash.com/photo-1622445268465-8438465b89a8?auto=format&fit=crop&w=800&q=80",
        "stock": 45,
        "rating": Decimal("4.6")
    },

    # --- WEARABLES ---
    {
        "name": "Horizon Titanium Smartwatch Pro",
        "description": "Grade-5 Titanium casing with AMOLED sapphire glass & dual GPS tracking.",
        "price": Decimal("19999.00"),
        "category": "Wearables",
        "image_url": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
        "stock": 18,
        "rating": Decimal("4.9")
    },
    {
        "name": "Fitness Tracker Band with SpO2 Sensor",
        "description": "Vibrant AMOLED touch display with 24/7 heart rate and sleep monitor.",
        "price": Decimal("2999.00"),
        "category": "Wearables",
        "image_url": "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&w=800&q=80",
        "stock": 50,
        "rating": Decimal("4.7")
    },
    {
        "name": "Polarized Audio Sunglasses with Bluetooth",
        "description": "UV400 protective lenses with open-ear directional speakers built into frames.",
        "price": Decimal("8999.00"),
        "category": "Wearables",
        "image_url": "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80",
        "stock": 15,
        "rating": Decimal("4.8")
    },
    {
        "name": "Stainless Steel Executive Chronograph Watch",
        "description": "Japanese Quartz movement chronograph watch with date window and mineral crystal.",
        "price": Decimal("7499.00"),
        "category": "Wearables",
        "image_url": "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80",
        "stock": 22,
        "rating": Decimal("4.8")
    },
    {
        "name": "Biometric Titanium Smart Health Ring",
        "description": "Sleek waterproof smart ring measuring sleep readiness, HRV, and body temperature.",
        "price": Decimal("15999.00"),
        "category": "Wearables",
        "image_url": "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80",
        "stock": 12,
        "rating": Decimal("4.9")
    },

    # --- GAMING ---
    {
        "name": "165Hz Curved 27-inch QHD Gaming Monitor",
        "description": "1ms MPRT response time with AMD FreeSync Premium and HDR10 support.",
        "price": Decimal("22999.00"),
        "category": "Gaming",
        "image_url": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80",
        "stock": 10,
        "rating": Decimal("4.9")
    },
    {
        "name": "Pro Gaming Headset with 7.1 Surround Sound",
        "description": "50mm neodymium drivers with broadcast quality detachable noise-canceling mic.",
        "price": Decimal("4999.00"),
        "category": "Gaming",
        "image_url": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80",
        "stock": 30,
        "rating": Decimal("4.8")
    },
    {
        "name": "Wireless Haptic Feedback Gamepad Controller",
        "description": "Ergonomic gaming controller compatible with PC, Console & Android.",
        "price": Decimal("3999.00"),
        "category": "Gaming",
        "image_url": "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?auto=format&fit=crop&w=800&q=80",
        "stock": 35,
        "rating": Decimal("4.7")
    },
    {
        "name": "Extended RGB Large Gaming Desk Mat",
        "description": "Water-resistant micro-woven cloth mousepad with 14 RGB light modes.",
        "price": Decimal("1199.00"),
        "category": "Gaming",
        "image_url": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
        "stock": 50,
        "rating": Decimal("4.6")
    },

    # --- LIFESTYLE & ACCESSORIES ---
    {
        "name": "Waterproof Solar Charge Modular Backpack",
        "description": "Built-in 10W high-efficiency solar panel with anti-theft TSA laptop compartment.",
        "price": Decimal("5499.00"),
        "category": "Lifestyle",
        "image_url": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
        "stock": 25,
        "rating": Decimal("4.8")
    },
    {
        "name": "Polarized Metal Frame Aviator Sunglasses",
        "description": "UV400 protective scratch-resistant TAC lenses with ultra-light alloy frame.",
        "price": Decimal("1999.00"),
        "category": "Lifestyle",
        "image_url": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80",
        "stock": 40,
        "rating": Decimal("4.7")
    },
    {
        "name": "Insulated Stainless Steel Water Flask 1L",
        "description": "Double-wall vacuum insulation keeps drinks cold for 24 hours or hot for 12 hours.",
        "price": Decimal("1299.00"),
        "category": "Lifestyle",
        "image_url": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80",
        "stock": 55,
        "rating": Decimal("4.8")
    },
    {
        "name": "RFID Blocking Bifold Genuine Leather Wallet",
        "description": "Handcrafted top-grain leather wallet with quick card access pop-up mechanism.",
        "price": Decimal("1499.00"),
        "category": "Lifestyle",
        "image_url": "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80",
        "stock": 45,
        "rating": Decimal("4.8")
    },
    {
        "name": "Vintage Heavyweight Canvas Messenger Bag",
        "description": "Waxed water-resistant canvas shoulder bag with padded 15.6-inch laptop pocket.",
        "price": Decimal("2799.00"),
        "category": "Lifestyle",
        "image_url": "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80",
        "stock": 20,
        "rating": Decimal("4.7")
    },

    # --- HOME TECH ---
    {
        "name": "Lumina Ambient Smart LED Studio Lamp",
        "description": "Smart WiFi LED desk lamp with customizable RGB color temperature and voice control.",
        "price": Decimal("2999.00"),
        "category": "Home Tech",
        "image_url": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80",
        "stock": 35,
        "rating": Decimal("4.9")
    },
    {
        "name": "HEPA H13 Smart Air Purifier",
        "description": "Filters 99.97% of dust, pollen, and odor with real-time PM2.5 air quality sensor.",
        "price": Decimal("8999.00"),
        "category": "Home Tech",
        "image_url": "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80",
        "stock": 18,
        "rating": Decimal("4.8")
    },
    {
        "name": "LIDAR Navigation Robot Vacuum & Mop",
        "description": "Automated smart vacuum cleaner with 4000Pa suction and auto-charging dock.",
        "price": Decimal("24999.00"),
        "category": "Home Tech",
        "image_url": "https://images.unsplash.com/photo-1563161937-013063515437?auto=format&fit=crop&w=800&q=80",
        "stock": 12,
        "rating": Decimal("4.9")
    },
    {
        "name": "Smart WiFi RGB Ambient LED Light Strip 5M",
        "description": "App-controlled LED strip with music sync, timer schedules and 16M colors.",
        "price": Decimal("1499.00"),
        "category": "Home Tech",
        "image_url": "https://images.unsplash.com/photo-1550985616-10810253b84d?auto=format&fit=crop&w=800&q=80",
        "stock": 50,
        "rating": Decimal("4.7")
    },
    {
        "name": "Ultrasonic Aroma Essential Oil Diffuser",
        "description": "Silent cool mist humidifier with 7 LED ambient light modes.",
        "price": Decimal("1799.00"),
        "category": "Home Tech",
        "image_url": "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80",
        "stock": 40,
        "rating": Decimal("4.8")
    }
]

def seed_diverse():
    print("Deleting duplicate products...")
    Product.objects.all().delete()

    products = [Product(**p) for p in UNIQUE_PRODUCTS]
    Product.objects.bulk_create(products)
    print(f"Successfully populated {Product.objects.count()} UNIQUE, distinct products in database!")

if __name__ == '__main__':
    seed_diverse()

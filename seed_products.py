import os
import django
import random
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'urbancart.settings')
django.setup()

from store.models import Product

# Sample product templates by category
CATEGORIES_DATA = {
    "Clothing": [
        ("Urban Oversized Streetwear Hoodie", "Heavyweight 450gsm organic cotton hoodie with relaxed fit.", 2499, "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80"),
        ("Minimalist Soft Cotton Tee", "Ultra-breathable 100% Pima cotton crew neck t-shirt.", 799, "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80"),
        ("Vintage Denim Trucker Jacket", "Classic indigo washed denim jacket with custom brass buttons.", 3999, "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80"),
        ("Techwear Tactical Cargo Pants", "Water-resistant stretch fabric with ergonomic utility pockets.", 2999, "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80"),
        ("Japanese Graphic Print Sweatshirt", "Japanese kanji streetwear graphic sweatshirt with fleece lining.", 2199, "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=800&q=80"),
        ("Classic Checked Flannel Shirt", "Brushed cotton flannel shirt with double chest pockets.", 1499, "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80"),
        ("Slim Fit Chino Trousers", "Tailored stretch cotton chinos suitable for formal & casual wear.", 1899, "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80"),
        ("Sleeveless Puffer Vest", "Lightweight insulated winter puffer vest with zip closure.", 2799, "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80"),
        ("Linen Summer Vacation Shirt", "Pure linen short-sleeved casual shirt with cuban collar.", 1699, "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80"),
        ("Athletic Fleece Joggers", "Tapered fleece joggers with drawstring waist and zip pockets.", 1299, "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=800&q=80"),
        ("Padded Winter Parka Coat", "Heavy duty windproof parka coat with faux fur hood trim.", 5999, "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=800&q=80"),
        ("Striped Polo T-Shirt", "Classic pique cotton polo t-shirt with ribbed collar.", 999, "https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80"),
        ("Tie-Dye Urban Hoodie", "Vibrant hand-dyed streetwear fleece hoodie.", 2399, "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=800&q=80"),
        ("Distressed Slim Denim Jeans", "Stretch denim jeans with natural fading and distressed knee slits.", 2699, "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80"),
        ("Merino Wool Knit Sweater", "Superfine merino wool crewneck knitted sweater.", 3499, "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&q=80"),
    ],
    "Footwear": [
        ("Urban Leather Low-Top Sneakers", "Handcrafted genuine leather sneakers with cushioned memory foam soles.", 4999, "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80"),
        ("Retro High-Top Basketball Shoes", "Classic 90s inspired high-top basketball sneakers.", 5999, "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80"),
        ("Knit Breathable Running Shoes", "Ultra-lightweight mesh running shoes with responsive foam cushioning.", 3499, "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80"),
        ("Chelsea Suede Boot", "Premium suede leather chelsea boots with elastic side panels.", 6499, "https://images.unsplash.com/photo-1638247025967-b4e38f787b76?auto=format&fit=crop&w=800&q=80"),
        ("Minimalist White Canvas Slip-Ons", "Casual slip-on canvas shoes with vulcanized rubber outsole.", 1899, "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80"),
        ("Outdoor Trail Hiking Boots", "Waterproof leather hiking boots with deep lugged rubber grip soles.", 7999, "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80"),
        ("Urban Chunky Dad Sneakers", "Bold chunky platform sneakers with multi-textured paneling.", 4499, "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80"),
        ("Formal Oxford Leather Shoes", "Hand-stitched dress oxfords in rich dark tan burnished leather.", 6999, "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=800&q=80"),
        ("Performance Turf Football Boots", "Synthetic upper football boots with molded cleats for firm ground.", 3999, "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&w=800&q=80"),
        ("Comfort Slide Sandals", "Contoured EVA footbed slides with padded strap.", 1299, "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?auto=format&fit=crop&w=800&q=80"),
    ],
    "Electronics": [
        ("Aura Pulse Wireless Headphones", "Next-gen spatial audio with active noise cancellation and 40h battery life.", 14999, "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80"),
        ("CyberDeck Mechanical Keyboard", "Hot-swappable RGB mechanical keyboard with custom lubricated switches.", 8999, "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80"),
        ("True Wireless Earbuds ANC", "Compact wireless earbuds with deep bass and IPX7 waterproofing.", 4999, "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80"),
        ("Ultra-HD 4K Action Camera", "Wide-angle 4K 60fps action camera with electronic image stabilization.", 12999, "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80"),
        ("Portable Bluetooth Speaker 30W", "Heavy bass waterproof 30W Bluetooth speaker with LED light show.", 3999, "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80"),
        ("Ergonomic Wireless Gaming Mouse", "High-precision 26,000 DPI optical sensor gaming mouse with RGB.", 3499, "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80"),
        ("Portable Fast Power Bank 20000mAh", "20000mAh Power Delivery fast charging power bank with dual Type-C ports.", 2499, "https://images.unsplash.com/photo-1609592424074-9c025cf26d40?auto=format&fit=crop&w=800&q=80"),
        ("USB-C 9-in-1 Multiport Hub", "Aluminum USB-C hub with 4K HDMI, SD card reader, and 100W PD.", 2999, "https://images.unsplash.com/photo-1544652478-6653e09f18a2?auto=format&fit=crop&w=800&q=80"),
        ("Studio Condenser Microphone", "USB condenser mic with cardioid pickup pattern and pop filter.", 4499, "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80"),
        ("Wireless Charging Pad 15W", "Fast wireless charger stand for smartphones and earbuds.", 1499, "https://images.unsplash.com/photo-1622445268465-8438465b89a8?auto=format&fit=crop&w=800&q=80"),
    ],
    "Wearables": [
        ("Horizon Smartwatch Pro", "Titanium casing with biometric sensors, GPS, and AMOLED display.", 19999, "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80"),
        ("Fitness Tracker Band HR", "Slim fitness tracker with SpO2 monitor, heart rate sensor, and 14-day battery.", 2999, "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&w=800&q=80"),
        ("Smart Audio Glasses", "Polarized UV sunglasses with open-ear Bluetooth directional speakers.", 8999, "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80"),
        ("Classic Chronograph Watch", "Stainless steel analog chronograph watch with date display.", 7499, "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80"),
        ("Smart Health Ring", "Titanium smart ring for continuous sleep tracking and body temperature.", 15999, "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80"),
    ],
    "Lifestyle": [
        ("Vortex Minimalist Backpack", "Waterproof modular design with built-in solar charging port.", 5499, "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80"),
        ("Polarized Aviator Sunglasses", "UV400 protective polarized lenses with lightweight alloy frame.", 1999, "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80"),
        ("Insulated Stainless Steel Flask 1L", "Double-wall vacuum insulated water bottle keeps drinks cold for 24h.", 1299, "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80"),
        ("Genuine Leather Bifold Wallet", "RFID blocking genuine leather wallet with coin pocket and card slots.", 1499, "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80"),
        ("Canvas Messenger Crossbody Bag", "Durable vintage canvas shoulder bag for 14-inch laptops.", 2799, "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80"),
    ],
    "Gaming": [
        ("CyberDeck RGB Mechanical Keyboard", "Hot-swappable gaming keyboard with customizable macro keys.", 8999, "https://images.unsplash.com/photo-1541140532154-b024d715b909?auto=format&fit=crop&w=800&q=80"),
        ("Pro Gaming Headset 7.1 Surround", "Over-ear gaming headset with detachable noise-canceling mic.", 4999, "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80"),
        ("Wireless Console Controller", "Ergonomic wireless gamepad controller with haptic feedback.", 3999, "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?auto=format&fit=crop&w=800&q=80"),
        ("Curved Gaming Monitor 165Hz 27-inch", "1ms response rate QHD curved gaming display.", 22999, "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80"),
        ("RGB Large Gaming Mousepad", "Micro-textured cloth gaming desk mat with 14 RGB lighting modes.", 1199, "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80"),
    ],
    "Home Tech": [
        ("Lumina Ambient Studio Lamp", "Smart LED lamp with customizable RGB glow spectrum and voice control.", 2999, "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80"),
        ("Smart Air Purifier HEPA H13", "App-controlled air purifier removing 99.97% airborne particles.", 8999, "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80"),
        ("Robot Vacuum Cleaner & Mop", "LIDAR navigation robotic vacuum with automatic dust disposal.", 24999, "https://images.unsplash.com/photo-1563161937-013063515437?auto=format&fit=crop&w=800&q=80"),
        ("Smart WiFi LED Light Strip 5M", "Syncs with music and smart home assistants.", 1499, "https://images.unsplash.com/photo-1550985616-10810253b84d?auto=format&fit=crop&w=800&q=80"),
        ("Aroma Essential Oil Diffuser", "Ultrasonic humidifier with soft ambient night light.", 1799, "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80"),
    ]
}

def generate_100_products():
    print("Clearing existing products...")
    Product.objects.all().delete()
    
    products = []
    count = 0
    
    # Variations to scale up to 105+ unique products
    color_variants = ["Black", "White", "Navy", "Olive", "Charcoal", "Burgundy", "Silver", "Gold", "Space Gray", "Sand"]
    editions = ["Pro Edition", "V2", "Classic", "Urban Series", "Limited Drop", "Core Collection", "Essential"]

    for category, items in CATEGORIES_DATA.items():
        for name, desc, base_price, img in items:
            for variant in range(2): # Create 2-3 variations of each item
                count += 1
                color = color_variants[count % len(color_variants)]
                edition = editions[count % len(editions)]
                
                # Title & Price modification per variant
                if variant == 0:
                    prod_name = name
                    price = base_price
                else:
                    prod_name = f"{name} - {color} ({edition})"
                    price = int(base_price * (1 + (variant * 0.15)))

                rating = round(random.uniform(4.3, 5.0), 1)
                stock = random.randint(15, 80)
                
                products.append(Product(
                    name=prod_name,
                    description=desc,
                    price=Decimal(str(price)),
                    category=category,
                    image_url=img,
                    stock=stock,
                    rating=Decimal(str(rating))
                ))
    
    # Bulk create for max performance
    Product.objects.bulk_create(products)
    print(f"Successfully generated {Product.objects.count()} products in database!")

if __name__ == '__main__':
    generate_100_products()

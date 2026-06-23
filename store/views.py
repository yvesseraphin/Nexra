from django.shortcuts import render
from django.http import JsonResponse, Http404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.core.mail import send_mail
from django.conf import settings
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from .models import Subscriber

# Core catalog and pages data mapped directly to the reference data
STORE_DATA = {
  "pages": {
    "index": {
      "slug": "index",
      "sections": {
        "todayBestDeals": {
          "items": [
            {
              "image": "images/product-nike-sneakers.png",
              "alt": "Nike Sneakers",
              "title": "Nike Sneakers",
              "description": "Best Sellers Sneakers",
              "price": "30 000RWF"
            },
            {
              "image": "images/product-goose-feather-comforter.png",
              "alt": "Goose Feather Fiber Comforter",
              "title": "Goose Feather Fiber Comforter",
              "description": "Bedding",
              "price": "10 000RWF"
            },
            {
              "image": "images/product-iphone-case.png",
              "alt": "iPhone 17 Pro Max Case",
              "title": "iPhone 17 Pro Max Case",
              "description": "Accessories",
              "price": "20 000RWF"
            },
            {
              "image": "images/product-diamond-earrings.png",
              "alt": "Diamond Stud Earrings",
              "title": "Diamond Stud Earrings",
              "description": "Earrings",
              "price": "30 000RWF"
            },
            {
              "image": "images/product-intex-beanless-chair.png",
              "alt": "Intex Beanless Chair",
              "title": "Intex Beanless Chair",
              "description": "Luxury",
              "price": "50 000RWF"
            },
            {
              "image": "images/product-gucci-handbag.png",
              "alt": "Gucci HandBag",
              "title": "Gucci HandBag",
              "description": "Side bag",
              "price": "15 000RWF"
            }
          ]
        },
        "bestSellers": {
          "items": [
            {
              "image": "images/product-blender.png",
              "alt": "Blender",
              "title": "Blender",
              "description": "Kitchen Appliance",
              "price": "30 000RWF"
            },
            {
              "image": "images/product-perfume.png",
              "alt": "Perfume",
              "title": "Perfume",
              "description": "Luxury",
              "price": "50 000RWF"
            },
            {
              "image": "images/product-book-shelf.png",
              "alt": "Furinno Pasir Book Shelf",
              "title": "Furinno Pasir Book Shelf",
              "description": "Accessories",
              "price": "100 000RWF"
            }
          ]
        }
      }
    },
    "tech": {
      "slug": "tech",
      "sections": {
        "trendingProducts": {
          "items": [
            {
              "image": "images/s7.png",
              "alt": "LG SMART TV",
              "title": "LG SMART TV",
              "description": "Smart TV",
              "price": "660 000RWF"
            },
            {
              "image": "images/s8.png",
              "alt": "FLASH DRIVE",
              "title": "FLASH DRIVE",
              "description": "Storage",
              "price": "10 000RWF"
            },
            {
              "image": "images/s9.png",
              "alt": "SAMSUNG FRIDGE",
              "title": "SAMSUNG FRIDGE",
              "description": "Home Appliance",
              "price": "500 000RWF"
            },
            {
              "image": "images/s10.png",
              "alt": "IPHONE 17 PRO MAX",
              "title": "IPHONE 17 PRO MAX",
              "description": "Smartphone",
              "price": "1 000 000RWF"
            },
            {
              "image": "images/s11.png",
              "alt": "DELL INSPIRON",
              "title": "DELL INSPIRON",
              "description": "Laptop",
              "price": "250 000RWF"
            },
            {
              "image": "images/s12.png",
              "alt": "LG SMART PODS",
              "title": "LG SMART PODS",
              "description": "Audio",
              "price": "15 000RWF"
            },
            {
              "image": "images/s13.png",
              "alt": "CAMERA",
              "title": "CAMERA",
              "description": "Photography",
              "price": "200 000RWF"
            },
            {
              "image": "images/s14.png",
              "alt": "BLUETOOTH SPEAKER",
              "title": "BLUETOOTH SPEAKER",
              "description": "Audio",
              "price": "250 000RWF"
            }
          ]
        },
        "bestSellers": {
          "items": [
            {
              "image": "images/s16.png",
              "alt": "APPLE SMART WATCH",
              "title": "APPLE SMART WATCH",
              "description": "Wearable",
              "price": "100 000RWF"
            },
            {
              "image": "images/s17.png",
              "alt": "ROBOT FAN",
              "title": "ROBOT FAN",
              "description": "Home Appliance",
              "price": "20 000RWF"
            },
            {
              "image": "images/s18.png",
              "alt": "HP PROBOOK 450",
              "title": "HP PROBOOK 450",
              "description": "Laptop",
              "price": "1 500 000RWF"
            },
            {
              "image": "images/s19.png",
              "alt": "GB HEADSETS",
              "title": "GB HEADSETS",
              "description": "Audio",
              "price": "20 000RWF"
            }
          ]
        }
      }
    },
    "kids": {
      "slug": "kids",
      "sections": {
        "todayBestDeals": {
          "items": [
            {
              "image": "images/K2.png",
              "alt": "PlayStation",
              "title": "PlayStation",
              "description": "Video Games",
              "price": "50 000RWF"
            },
            {
              "image": "images/K3.png",
              "alt": "Nintendo Switch 2",
              "title": "Nintendo Switch 2",
              "description": "Video Games",
              "price": "80 000RWF"
            },
            {
              "image": "images/K4.png",
              "alt": "Microsoft Xbox",
              "title": "Microsoft Xbox",
              "description": "Entertainment",
              "price": "85 000RWF"
            },
            {
              "image": "images/K5.png",
              "alt": "High Chair",
              "title": "High Chair",
              "description": "Babies",
              "price": "30 000RWF"
            },
            {
              "image": "images/K6.png",
              "alt": "Baby Swing",
              "title": "Baby Swing",
              "description": "Babies",
              "price": "50 000RWF"
            },
            {
              "image": "images/K7.png",
              "alt": "Baby Walker",
              "title": "Baby Walker",
              "description": "Side bag",
              "price": "50 000RWF"
            }
          ]
        },
        "toyHighlights": {
          "items": [
            {
              "image": "images/Component 1.png",
              "alt": "Teddy bear",
              "title": "Teddy bear",
              "description": "Toys",
              "price": "5 000RWF"
            },
            {
              "image": "images/K10.png",
              "alt": "Rabbits Toy",
              "title": "Rabbits Toy",
              "description": "Toys",
              "price": "4 000RWF"
            },
            {
              "image": "images/K11.png",
              "alt": "Big Teddy Bear",
              "title": "Big Teddy Bear",
              "description": "Toys",
              "price": "10 000RWF"
            },
            {
              "image": "images/K12.png",
              "alt": "Non-Toxic Wax Crayon",
              "title": "Non-Toxic Wax Crayon",
              "description": "Toys",
              "price": "8 000RWF"
            },
            {
              "image": "images/K13.png",
              "alt": "Color Paint",
              "title": "Color Paint",
              "description": "Painting",
              "price": "7 000RWF"
            },
            {
              "image": "images/K14.png",
              "alt": "3Doodler 3D Pen",
              "title": "3Doodler 3D Pen",
              "description": "Entertainment",
              "price": "15 000RWF"
            }
          ]
        }
      }
    },
    "beauty": {
      "slug": "beauty",
      "sections": {
        "trendingProducts": {
          "items": [
            {
              "image": "images/top.png",
              "alt": "Laxi collection",
              "title": "Laxi collection",
              "description": "Collection of skin products",
              "price": "30 000 RWF"
            },
            {
              "image": "images/Component 1.png",
              "alt": "Biodance Products",
              "title": "Biodance Products",
              "description": "Facial masks",
              "price": "10 000 RWF"
            },
            {
              "image": "images/Rectangle 35.png",
              "alt": "Alya skin care products",
              "title": "Alya skin care products",
              "description": "Best of the brands",
              "price": "20 000 RWF"
            },
            {
              "image": "images/Rectangle 21.png",
              "alt": "Kylie Skin",
              "title": "Kylie Skin",
              "description": "Sunscreen",
              "price": "30 000 RWF"
            },
            {
              "image": "images/Rectangle 22.png",
              "alt": "Collagen pad",
              "title": "Collagen pad",
              "description": "Day and Night",
              "price": "50 000 RWF"
            },
            {
              "image": "images/Rectangle 24.png",
              "alt": "Breylee Rose",
              "title": "Breylee Rose",
              "description": "Eye Mask",
              "price": "100 000 RWF"
            }
          ]
        },
        "collections": {
          "items": [
            {
              "image": "images/Rectangle 31.png",
              "alt": "Cherry Blossom",
              "title": "Cherry Blossom",
              "description": "The light of autumn",
              "price": "30 000 RWF"
            },
            {
              "image": "images/Rectangle 35.png",
              "alt": "Moistures",
              "title": "Moistures",
              "description": "Luxury",
              "price": "50 000 RWF"
            },
            {
              "image": "images/Rectangle 30 (1).png",
              "alt": "Jarsking Collection",
              "title": "Jarsking Collection",
              "description": "Serums & Moisturizers",
              "price": "100 000 RWF"
            }
          ]
        }
      }
    },
    "food": {
      "slug": "food",
      "sections": {
        "popularProducts": {
          "items": [
            {
              "image": "images/div.product-img-action-wrap.png",
              "alt": "Lemon",
              "category": "Snack",
              "title": "Fresh organic wild farm lemon 500gm pack",
              "price": "5 000 RWF"
            },
            {
              "image": "images/div.product-img-action-wrap (1).png",
              "alt": "Hazelnut",
              "category": "Hodo Foods",
              "title": "Best snacks with hazel nut pack 200gm",
              "price": "52 085 RWF"
            },
            {
              "image": "images/→ product-3-1.jpg.png",
              "alt": "Watermelon",
              "category": "Snack",
              "title": "Organic fresh venila farm watermelon 5kg",
              "price": "48 085 RWF"
            },
            {
              "image": "images/→ product-6-1.jpg.png",
              "alt": "Muffin",
              "category": "Hodo Foods",
              "title": "Chobani Complete Vanilla Greek Yogurt",
              "price": "1200 RWF"
            },
            {
              "image": "images/→ product-7-1.jpg.png",
              "alt": "Blackberries",
              "category": "Fruit",
              "title": "BlackBerries",
              "price": "8 085 RWF"
            },
            {
              "image": "images/→ product-8-1.jpg.png",
              "alt": "Black Burgers",
              "category": "Snack",
              "title": "Black Burgers",
              "price": "35 085 RWF"
            }
          ]
        },
        "dealsOfDay": {
          "items": [
            {
              "image": "images/banner-5.png.png",
              "alt": "Organic Quinoa",
              "title": "Seeds of Change Organic Quinoa, Brown, & Red Rice",
              "price": "2000 RWF"
            },
            {
              "image": "images/banner-6.png.png",
              "alt": "Perdue Simply Smart Organics",
              "title": "Perdue Simply Smart Organics Gluten Free",
              "price": "7000 RWF"
            },
            {
              "image": "images/banner-8.png.png",
              "alt": "Simply Lemonade with Raspberry Juice",
              "title": "Simply Lemonade with Raspberry Juice",
              "price": "85000 RWF"
            }
          ]
        }
      }
    },
    "fashion": {
      "slug": "fashion",
      "sections": {
        "collections": {
          "groups": [
            {
              "title": "Clothing",
              "href": "#clothing",
              "items": [
                {
                  "image": "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300&h=300&fit=crop",
                  "alt": "Men's Suit"
                },
                {
                  "image": "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=300&h=300&fit=crop",
                  "alt": "Beige Suit"
                },
                {
                  "image": "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=300&h=300&fit=crop",
                  "alt": "Women's Dress"
                },
                {
                  "image": "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=300&h=300&fit=crop",
                  "alt": "White Coat"
                },
                {
                  "image": "https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=300&h=300&fit=crop",
                  "alt": "Women's Fashion"
                },
                {
                  "image": "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=300&h=300&fit=crop",
                  "alt": "Gray Coat"
                },
                {
                  "image": "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=300&h=300&fit=crop",
                  "alt": "Black Boots"
                },
                {
                  "image": "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=300&h=300&fit=crop",
                  "alt": "Navy Shoes"
                }
              ]
            },
            {
              "title": "Shoes",
              "href": "#shoes",
              "items": [
                {
                  "image": "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=300&fit=crop",
                  "alt": "Brown Sneakers"
                },
                {
                  "image": "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=300&h=300&fit=crop",
                  "alt": "White Sneakers"
                },
                {
                  "image": "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=300&h=300&fit=crop",
                  "alt": "Black Heels"
                },
                {
                  "image": "https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=300&h=300&fit=crop",
                  "alt": "Navy Loafers"
                },
                {
                  "image": "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=300&h=300&fit=crop",
                  "alt": "Running Shoes"
                },
                {
                  "image": "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=300&h=300&fit=crop",
                  "alt": "Boots"
                },
                {
                  "image": "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=300&h=300&fit=crop",
                  "alt": "Casual Shoes"
                },
                {
                  "image": "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=300&h=300&fit=crop",
                  "alt": "Sneakers"
                }
              ]
            },
            {
              "title": "Bags",
              "href": "#bags",
              "items": [
                {
                  "image": "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300&h=300&fit=crop",
                  "alt": "Beige Bag"
                },
                {
                  "image": "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=300&h=300&fit=crop",
                  "alt": "Gray Backpack"
                },
                {
                  "image": "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300&h=300&fit=crop",
                  "alt": "Leather Bag"
                },
                {
                  "image": "https://images.unsplash.com/photo-1564222195116-8a74a96b2c8c?w=300&h=300&fit=crop",
                  "alt": "White Bags"
                },
                {
                  "image": "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=300&h=300&fit=crop",
                  "alt": "Handbag"
                },
                {
                  "image": "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=300&h=300&fit=crop",
                  "alt": "Tote Bag"
                },
                {
                  "image": "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=300&h=300&fit=crop",
                  "alt": "Crossbody"
                },
                {
                  "image": "https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?w=300&h=300&fit=crop",
                  "alt": "Satchel"
                }
              ]
            },
            {
              "title": "Hoodies",
              "href": "#hoodies",
              "items": [
                {
                  "image": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=300&h=300&fit=crop",
                  "alt": "Yellow Hoodie"
                },
                {
                  "image": "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=300&h=300&fit=crop",
                  "alt": "Blue Gradient Hoodie"
                },
                {
                  "image": "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=300&h=300&fit=crop",
                  "alt": "Black Hoodie"
                },
                {
                  "image": "https://images.unsplash.com/photo-1620799139834-6b8f844fbe61?w=300&h=300&fit=crop",
                  "alt": "White Hoodie"
                },
                {
                  "image": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=300&h=300&fit=crop",
                  "alt": "Hoodie Style"
                },
                {
                  "image": "https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=300&h=300&fit=crop",
                  "alt": "Casual Hoodie"
                },
                {
                  "image": "https://images.unsplash.com/photo-1578932750355-5eb30ece487a?w=300&h=300&fit=crop",
                  "alt": "Oversized Hoodie"
                },
                {
                  "image": "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=300&h=300&fit=crop",
                  "alt": "Zip Hoodie"
                }
              ]
            }
          ]
        },
        "mostPopular": {
          "items": [
            {
              "image": "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=500&fit=crop",
              "alt": "Beige Fashion",
              "title": "Beige Knitwear",
              "description": "New Winter Collection",
              "price": "11,780 RWF",
              "badgeClass": "badge-new",
              "badgeLabel": "New"
            },
            {
              "image": "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=400&h=500&fit=crop",
              "alt": "Woman with Hat",
              "title": "Classic Fedora Hat",
              "description": "Accessories",
              "price": "7,806 RWF",
              "badgeClass": "badge-sale",
              "badgeLabel": "Sale"
            },
            {
              "image": "https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=400&h=500&fit=crop",
              "alt": "Striped Shirt",
              "title": "Striped Summer Shirt",
              "description": "Casual Clothing",
              "price": "1,956 RWF",
              "badgeClass": "badge-hot",
              "badgeLabel": "Hot"
            },
            {
              "image": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop",
              "alt": "Man in Coat",
              "title": "Double-Breasted Coat",
              "description": "Men's Outerwear",
              "price": "7,220 RWF",
              "badgeClass": "badge-hot",
              "badgeLabel": "Hot"
            }
          ]
        },
        "justForYou": {
          "items": [
            {
              "image": "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=800&h=600&fit=crop",
              "alt": "White tops",
              "title": "White Cotton Top",
              "description": "White tops always bring a good mood.",
              "price": "15,000 RWF"
            },
            {
              "image": "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop",
              "alt": "Beautiful heels",
              "title": "Sleek Black Heels",
              "description": "Get yourself party-ready with beautiful heels!",
              "price": "28,000 RWF"
            },
            {
              "image": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=600&fit=crop",
              "alt": "Simple bag",
              "title": "Elegant Leather Handbag",
              "description": "A simple bag for a simple outing!",
              "price": "15,000 RWF"
            },
            {
              "image": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&h=600&fit=crop",
              "alt": "Pink hoodie",
              "title": "Classic Pink Hoodie",
              "description": "Who said pink hoodies can't look good?",
              "price": "13,000 RWF"
            },
            {
              "image": "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&h=600&fit=crop",
              "alt": "Fashion freedom",
              "title": "Denim Jacket",
              "description": "Good fashion also means freedom.",
              "price": "22,000 RWF"
            },
            {
              "image": "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&h=600&fit=crop",
              "alt": "Warm hoodie",
              "title": "Warm Grey Hoodie",
              "description": "Stay warm. Look cool.",
              "price": "20,000 RWF"
            }
          ]
        }
      }
    },
    "accessories": {
      "slug": "accessories",
      "sections": {
        "monthlyDeals": {
          "items": [
            {
              "image": "images/image 26.png",
              "alt": "Simple Watches",
              "title": "Simple watches",
              "description": "Timeless design with elegance",
              "price": "18,000 RWF"
            },
            {
              "image": "images/image 28.png",
              "alt": "Necklaces",
              "title": "Necklaces",
              "description": "Get a simple but elegant look",
              "price": "20,000 RWF"
            },
            {
              "image": "images/image 25.png",
              "alt": "Bracelets",
              "title": "Bracelets",
              "description": "Timeless design with elegant gems",
              "price": "5,000 RWF"
            },
            {
              "image": "images/image 12.png",
              "alt": "Elite Mini",
              "title": "Elite Mini",
              "description": "Luxury feels everyday price",
              "price": "25,000 RWF"
            }
          ]
        },
        "productColumns": {
          "columns": [
            {
              "title": "Necklace",
              "items": [
                {
                  "image": "images/image 31.png",
                  "alt": "Pendant Necklace",
                  "title": "Pendant Necklace",
                  "price": "20,000 RWF"
                },
                {
                  "image": "images/image 32.png",
                  "alt": "Choker Necklace",
                  "title": "Choker Necklace",
                  "price": "Rp 950.000"
                },
                {
                  "image": "images/image 33.png",
                  "alt": "Lariat Necklace",
                  "title": "Lariat Necklace",
                  "price": "Rp 1.170.000"
                }
              ]
            },
            {
              "title": "Women's Watch",
              "items": [
                {
                  "image": "images/image 34.png",
                  "alt": "Analog Dress Watch",
                  "title": "Analog Dress Watch",
                  "price": "Rp 960.000"
                },
                {
                  "image": "images/image 36.png",
                  "alt": "Leather watch",
                  "title": "Leather watch",
                  "price": "Rp 950.000"
                },
                {
                  "image": "images/image 37.png",
                  "alt": "Minimalist Slim Watch",
                  "title": "Minimalist Slim Watch",
                  "price": "Rp 1.170.000"
                }
              ]
            },
            {
              "title": "Men's Watch",
              "items": [
                {
                  "image": "images/image 38.png",
                  "alt": "Dress Watch",
                  "title": "Dress Watch",
                  "price": "Rp 1.198.000"
                },
                {
                  "image": "images/image 39.png",
                  "alt": "Chronograph watch",
                  "title": "Chronograph watch",
                  "price": "Rp 1.280.000"
                },
                {
                  "image": "images/image 41.png",
                  "alt": "Rado watch",
                  "title": "Rado watch",
                  "price": "Rp 1.170.000"
                }
              ]
            }
          ]
        }
      }
    }
  }
}

# Add static paths helper
def fix_static_paths(data):
    if isinstance(data, dict):
        new_dict = {}
        for k, v in data.items():
            if k == "image" and isinstance(v, str) and not v.startswith("http") and not v.startswith("/static/"):
                new_dict[k] = "/static/" + v
            else:
                new_dict[k] = fix_static_paths(v)
        return new_dict
    elif isinstance(data, list):
        return [fix_static_paths(x) for x in data]
    return data

# Django HTML Views
def home(request):
    return render(request, 'index.html')

def food(request):
    return render(request, 'store/food.html')

def tech(request):
    return render(request, 'store/tech.html')

def fashion(request):
    return render(request, 'store/fashion.html')

def beauty(request):
    return render(request, 'store/beauty.html')

def kids(request):
    return render(request, 'store/kids.html')

def accessories(request):
    return render(request, 'store/accessories.html')

def product(request):
    return render(request, 'store/product.html')

# Django JSON API endpoints
def api_page_data(request, slug):
    page_data = STORE_DATA["pages"].get(slug)
    if not page_data:
        return JsonResponse({"error": f"Unknown page {slug}"}, status=404)
    # Return page data with fixed static image paths
    fixed_data = fix_static_paths(page_data)
    return JsonResponse(fixed_data)

def api_catalog_item(request, slug):
    # Search in all pages for item with matching slug
    # slug is structured as "page-title_slugified"
    for page_slug, page_data in STORE_DATA["pages"].items():
        for section_name, section in page_data["sections"].items():
            # some sections have groups or columns
            items = []
            if "items" in section:
                items = section["items"]
            elif "groups" in section:
                for grp in section["groups"]:
                    items.extend(grp.get("items", []))
            elif "columns" in section:
                for col in section["columns"]:
                    items.extend(col.get("items", []))
            
            for item in items:
                title = item.get("title", item.get("alt", ""))
                import re
                item_slug = f"{page_slug}-{re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')}"
                if item_slug == slug:
                    # Found it! Let's return details
                    fixed_item = fix_static_paths(item)
                    fixed_item["slug"] = item_slug
                    fixed_item["page"] = page_slug
                    return JsonResponse(fixed_item)
                    
    return JsonResponse({"error": f"Unknown catalog item {slug}"}, status=404)


# ── Newsletter subscribe ─────────────────────────────────────

@csrf_exempt
@require_POST
def api_subscribe(request):
    import json
    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, AttributeError):
        return JsonResponse({'error': 'Invalid request.'}, status=400)

    email = str(data.get('email') or '').strip().lower()

    if not email:
        return JsonResponse({'error': 'Please enter your email address.'}, status=400)

    try:
        validate_email(email)
    except ValidationError:
        return JsonResponse({'error': 'Please enter a valid email address.'}, status=400)

    subscriber, created = Subscriber.objects.get_or_create(email=email)

    if not created:
        if subscriber.is_active:
            return JsonResponse({'message': "You're already subscribed — we'll keep the deals coming!"})
        else:
            # Re-activating an unsubscribed email — fall through to send welcome again
            subscriber.is_active = True
            subscriber.save(update_fields=['is_active'])

    # Send welcome email (non-blocking — logs error silently so the API never breaks)
    try:
        send_mail(
            subject='Welcome to Nexra — You\'re on the list!',
            message='',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
            html_message=f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Nexra</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#111111;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;letter-spacing:2px;font-weight:800;">NEXRA</h1>
              <p style="margin:6px 0 0;color:#aaaaaa;font-size:13px;letter-spacing:1px;">DISCOVER YOUR STYLE</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="margin:0 0 16px;color:#111111;font-size:22px;font-weight:700;">You're on the list!</h2>
              <p style="margin:0 0 16px;color:#555555;font-size:15px;line-height:1.7;">
                Thanks for subscribing to Nexra. You'll be the first to know about exclusive deals,
                new arrivals, and special offers — delivered straight to your inbox.
              </p>
              <p style="margin:0 0 32px;color:#555555;font-size:15px;line-height:1.7;">
                In the meantime, explore our latest collections.
              </p>
              <a href="http://localhost:8000/"
                 style="display:inline-block;background:#111111;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:0.5px;">
                Shop Now
              </a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9f9f9;padding:24px 40px;border-top:1px solid #eeeeee;text-align:center;">
              <p style="margin:0;color:#aaaaaa;font-size:12px;line-height:1.6;">
                You're receiving this because you subscribed at nexra.com.<br>
                &copy; 2026 Nexra. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
""",
        )
    except Exception:
        # Email failed (e.g. credentials not set) — still confirm subscription
        pass

    return JsonResponse({'message': 'You\'re subscribed! Check your inbox for a welcome email.'}, status=201 if created else 200)

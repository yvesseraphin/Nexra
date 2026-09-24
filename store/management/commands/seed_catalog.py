import re
from decimal import Decimal
from django.core.management.base import BaseCommand
from store.models import Category, Product
from store.views import STORE_DATA

def parse_price(price_str):
    if not price_str:
        return Decimal('0')
    cleaned = re.sub(r'[^\d.]', '', str(price_str))
    try:
        return Decimal(cleaned)
    except Exception:
        return Decimal('0')

class Command(BaseCommand):
    help = 'Seeds database Category and Product tables from STORE_DATA'

    def handle(self, *args, **options):

        categories_map = {
            'food': 'Food',
            'tech': 'Tech',
            'fashion': 'Fashion',
            'beauty': 'Beauty Routine',
            'kids': 'Kids',
            'accessories': 'Accessories',
        }

        cat_objs = {}
        for slug, name in categories_map.items():
            cat, _ = Category.objects.get_or_create(slug=slug, defaults={'name': name})
            cat_objs[slug] = cat
            self.stdout.write(f"Category: {name} ({slug})")

        created_count = 0
        updated_count = 0

        for page_slug, page_data in STORE_DATA.get("pages", {}).items():
            category = cat_objs.get(page_slug)
            sections = page_data.get("sections", {})

            for section_name, section in sections.items():
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
                    title = item.get("title") or item.get("alt") or "Untitled Product"
                    raw_slug = f"{page_slug}-{re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')}"
                    price_str = item.get("price", "0 RWF")
                    price_val = parse_price(price_str)
                    image_path = item.get("image", "")

                    prod, created = Product.objects.update_or_create(
                        slug=raw_slug,
                        defaults={
                            'title': title,
                            'category': category,
                            'description': item.get("description", ""),
                            'full_description': item.get("fullDescription", item.get("description", "")),
                            'price': price_str,
                            'price_value': price_val,
                            'image': image_path,
                            'alt': item.get("alt", title),
                            'section': section_name,
                            'page': page_slug,
                            'is_featured': section_name in ('todayBestDeals', 'bestSellers', 'trendingProducts'),
                            'stock': 50,
                        }
                    )
                    if created:
                        created_count += 1
                    else:
                        updated_count += 1

        self.stdout.write(self.style.SUCCESS(
            f"Catalog seeded successfully! Created: {created_count}, Updated: {updated_count}, Total in DB: {Product.objects.count()}"
        ))

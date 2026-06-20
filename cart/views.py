import json
import time
import random
import string
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required

from .models import CartItem, Order, OrderItem, PaymentMethod, Address


# ── Page views ──────────────────────────────────────────────

def cart_view(request):
    return render(request, 'cart/cart.html')


def checkout_view(request):
    return render(request, 'cart/checkout.html')


# ── Helpers ──────────────────────────────────────────────────

def _require_auth(request):
    """Return user if authenticated via session, else None."""
    if request.user.is_authenticated:
        return request.user
    return None


def _json(request):
    try:
        return json.loads(request.body)
    except (json.JSONDecodeError, AttributeError):
        return {}


def _generate_order_number():
    ts = str(int(time.time() * 1000))[-8:]
    return f"NXR-{ts}"


def _detect_brand(number):
    n = str(number or '').replace(' ', '').replace('-', '')
    if n.startswith('4'):
        return 'Visa'
    if n[:2] in [str(i) for i in range(51, 56)] or (n[:4].isdigit() and 2221 <= int(n[:4]) <= 2720):
        return 'Mastercard'
    if n[:2] in ('34', '37'):
        return 'American Express'
    if n[:4] in ('6011',) or n[:2] == '65':
        return 'Discover'
    return 'Card'


def _format_expiry_label(month, year):
    m = str(month or '').zfill(2)[:2]
    y = str(year or '')
    if len(y) == 4:
        y = y[-2:]
    return f"{m}/{y}" if m and y else ''


# ── Cart API ─────────────────────────────────────────────────

@csrf_exempt
@require_http_methods(['GET', 'POST', 'DELETE'])
def api_cart(request):
    user = _require_auth(request)
    if not user:
        return JsonResponse({'error': 'Authentication required.'}, status=401)

    if request.method == 'GET':
        items = CartItem.objects.filter(user=user)
        return JsonResponse({'cart': [i.to_dict() for i in items]})

    if request.method == 'POST':
        data = _json(request)
        product_id = str(data.get('id') or data.get('product_id') or '').strip()
        if not product_id:
            return JsonResponse({'error': 'product_id is required.'}, status=400)

        qty = max(1, int(data.get('quantity') or 1))
        item, created = CartItem.objects.get_or_create(
            user=user,
            product_id=product_id,
            defaults={
                'slug':        str(data.get('slug') or product_id),
                'title':       str(data.get('title') or 'Item'),
                'price':       str(data.get('price') or ''),
                'price_value': float(data.get('priceValue') or data.get('price_value') or 0),
                'image':       str(data.get('image') or ''),
                'page':        str(data.get('page') or ''),
                'quantity':    qty,
            }
        )
        if not created:
            item.quantity += qty
            item.save()

        items = CartItem.objects.filter(user=user)
        return JsonResponse({'cart': [i.to_dict() for i in items]}, status=201 if created else 200)

    if request.method == 'DELETE':
        CartItem.objects.filter(user=user).delete()
        return JsonResponse({'cart': []})


@csrf_exempt
@require_http_methods(['PATCH', 'DELETE'])
def api_cart_item(request, product_id):
    user = _require_auth(request)
    if not user:
        return JsonResponse({'error': 'Authentication required.'}, status=401)

    try:
        item = CartItem.objects.get(user=user, product_id=product_id)
    except CartItem.DoesNotExist:
        return JsonResponse({'error': 'Item not found.'}, status=404)

    if request.method == 'DELETE':
        item.delete()
        items = CartItem.objects.filter(user=user)
        return JsonResponse({'cart': [i.to_dict() for i in items]})

    if request.method == 'PATCH':
        data = _json(request)
        qty = data.get('quantity')
        if qty is not None:
            qty = int(qty)
            if qty <= 0:
                item.delete()
            else:
                item.quantity = qty
                item.save()
        items = CartItem.objects.filter(user=user)
        return JsonResponse({'cart': [i.to_dict() for i in items]})


# ── Orders API ───────────────────────────────────────────────

@csrf_exempt
@require_http_methods(['GET', 'POST'])
def api_orders(request):
    user = _require_auth(request)
    if not user:
        return JsonResponse({'error': 'Authentication required.'}, status=401)

    if request.method == 'GET':
        orders = Order.objects.filter(user=user)
        return JsonResponse({'orders': [o.to_dict() for o in orders]})

    if request.method == 'POST':
        data = _json(request)

        # Gather cart items — prefer DB, fall back to payload
        cart_items = list(CartItem.objects.filter(user=user))
        payload_items = data.get('items') or []

        if not cart_items and not payload_items:
            return JsonResponse({'error': 'Cart is empty.'}, status=400)

        # Build line items list
        lines = []
        if cart_items:
            for ci in cart_items:
                lines.append({
                    'product_id':  ci.product_id,
                    'slug':        ci.slug,
                    'title':       ci.title,
                    'price':       ci.price,
                    'price_value': float(ci.price_value),
                    'image':       ci.image,
                    'page':        ci.page,
                    'quantity':    ci.quantity,
                })
        else:
            for pi in payload_items:
                lines.append({
                    'product_id':  str(pi.get('id') or pi.get('product_id') or ''),
                    'slug':        str(pi.get('slug') or ''),
                    'title':       str(pi.get('title') or 'Item'),
                    'price':       str(pi.get('price') or ''),
                    'price_value': float(pi.get('priceValue') or pi.get('price_value') or 0),
                    'image':       str(pi.get('image') or ''),
                    'page':        str(pi.get('page') or ''),
                    'quantity':    int(pi.get('quantity') or 1),
                })

        subtotal = sum(l['price_value'] * l['quantity'] for l in lines)
        shipping = 5000
        total = subtotal + shipping
        total_items = sum(l['quantity'] for l in lines)

        # Contact
        contact = data.get('contact') or {}
        # Shipping
        ship = data.get('shippingAddress') or {}
        # Payment summary (masked)
        pay = data.get('paymentSummary') or data.get('paymentMethod') or {}

        order = Order.objects.create(
            user=user,
            order_number=_generate_order_number(),
            subtotal=subtotal,
            shipping_cost=shipping,
            total=total,
            total_items=total_items,
            notes=str(data.get('notes') or ''),
            contact_full_name=str(contact.get('fullName') or ''),
            contact_email=str(contact.get('email') or ''),
            contact_phone=str(contact.get('phone') or ''),
            ship_full_name=str(ship.get('fullName') or ''),
            ship_address1=str(ship.get('addressLine1') or ''),
            ship_address2=str(ship.get('addressLine2') or ''),
            ship_city=str(ship.get('city') or ''),
            ship_state_region=str(ship.get('stateRegion') or ''),
            ship_postal_code=str(ship.get('postalCode') or ''),
            ship_country=str(ship.get('country') or 'Rwanda'),
            ship_instructions=str(ship.get('deliveryInstructions') or ''),
            payment_brand=str(pay.get('brand') or ''),
            payment_last4=str(pay.get('last4') or '')[:4],
            payment_expiry=str(pay.get('expiryLabel') or ''),
            payment_holder=str(pay.get('holderName') or ''),
            payment_label=str(pay.get('label') or ''),
            payment_status='Payment details received' if pay.get('last4') else 'Pending',
        )

        for l in lines:
            OrderItem.objects.create(
                order=order,
                product_id=l['product_id'],
                slug=l['slug'],
                title=l['title'],
                price=l['price'],
                price_value=l['price_value'],
                image=l['image'],
                page=l['page'],
                quantity=l['quantity'],
            )

        # Clear DB cart
        CartItem.objects.filter(user=user).delete()

        # Auto-save address if requested
        if data.get('saveAddress') and ship.get('addressLine1'):
            addr_qs = Address.objects.filter(user=user)
            Address.objects.create(
                user=user,
                full_name=str(ship.get('fullName') or ''),
                address1=str(ship.get('addressLine1') or ''),
                address2=str(ship.get('addressLine2') or ''),
                city=str(ship.get('city') or ''),
                state_region=str(ship.get('stateRegion') or ''),
                postal_code=str(ship.get('postalCode') or ''),
                country=str(ship.get('country') or 'Rwanda'),
                phone=str(contact.get('phone') or ''),
                is_default=not addr_qs.exists(),
            )

        # Auto-save payment method if requested
        if data.get('savePaymentMethod') and pay.get('last4'):
            pm_qs = PaymentMethod.objects.filter(user=user)
            brand = str(pay.get('brand') or _detect_brand(str(pay.get('cardNumber') or '')))
            expiry_label = _format_expiry_label(pay.get('expiryMonth'), pay.get('expiryYear'))
            PaymentMethod.objects.create(
                user=user,
                type=str(pay.get('type') or 'card'),
                brand=brand,
                last4=str(pay.get('last4') or '')[:4],
                expiry_month=str(pay.get('expiryMonth') or ''),
                expiry_year=str(pay.get('expiryYear') or ''),
                expiry_label=expiry_label,
                holder_name=str(pay.get('holderName') or ''),
                billing_email=str(pay.get('billingEmail') or ''),
                billing_phone=str(pay.get('billingPhone') or ''),
                label=str(pay.get('label') or f"{brand} ending in {pay.get('last4','')}"),
                is_default=not pm_qs.exists(),
            )

        return JsonResponse({'order': order.to_dict()}, status=201)


@csrf_exempt
@require_http_methods(['GET'])
def api_order_detail(request, order_id):
    user = _require_auth(request)
    if not user:
        return JsonResponse({'error': 'Authentication required.'}, status=401)

    try:
        order = Order.objects.get(pk=order_id, user=user)
    except Order.DoesNotExist:
        return JsonResponse({'error': 'Order not found.'}, status=404)

    return JsonResponse({'order': order.to_dict()})


# ── Payment Methods API ──────────────────────────────────────

@csrf_exempt
@require_http_methods(['GET', 'POST'])
def api_payments(request):
    user = _require_auth(request)
    if not user:
        return JsonResponse({'error': 'Authentication required.'}, status=401)

    if request.method == 'GET':
        methods = PaymentMethod.objects.filter(user=user)
        return JsonResponse({'paymentMethods': [m.to_dict() for m in methods]})

    if request.method == 'POST':
        data = _json(request)
        card_number = str(data.get('cardNumber') or data.get('last4') or '')
        last4 = card_number.replace(' ', '').replace('-', '')[-4:]
        if not last4:
            return JsonResponse({'error': 'Card number is required.'}, status=400)

        holder = str(data.get('holderName') or '').strip()
        if not holder:
            return JsonResponse({'error': 'Cardholder name is required.'}, status=400)

        exp_m = str(data.get('expiryMonth') or '').zfill(2)[:2]
        exp_y = str(data.get('expiryYear') or '')
        if len(exp_y) == 2:
            exp_y = '20' + exp_y
        exp_y = exp_y[:4]
        expiry_label = _format_expiry_label(exp_m, exp_y)

        brand = str(data.get('brand') or _detect_brand(card_number))
        label = f"{brand} ending in {last4}"
        make_default = bool(data.get('isDefault')) or not PaymentMethod.objects.filter(user=user).exists()

        if make_default:
            PaymentMethod.objects.filter(user=user).update(is_default=False)

        pm = PaymentMethod.objects.create(
            user=user,
            type=str(data.get('type') or 'card'),
            brand=brand,
            last4=last4,
            expiry_month=exp_m,
            expiry_year=exp_y,
            expiry_label=expiry_label,
            holder_name=holder,
            billing_email=str(data.get('billingEmail') or '').lower(),
            billing_phone=str(data.get('billingPhone') or ''),
            label=label,
            is_default=make_default,
        )
        return JsonResponse({'paymentMethod': pm.to_dict()}, status=201)


@csrf_exempt
@require_http_methods(['PATCH', 'DELETE'])
def api_payment_detail(request, pm_id):
    user = _require_auth(request)
    if not user:
        return JsonResponse({'error': 'Authentication required.'}, status=401)

    try:
        pm = PaymentMethod.objects.get(pk=pm_id, user=user)
    except PaymentMethod.DoesNotExist:
        return JsonResponse({'error': 'Payment method not found.'}, status=404)

    if request.method == 'DELETE':
        pm.delete()
        # Re-assign default if needed
        methods = PaymentMethod.objects.filter(user=user)
        if methods.exists() and not methods.filter(is_default=True).exists():
            first = methods.first()
            first.is_default = True
            first.save()
        return JsonResponse({'paymentMethods': [m.to_dict() for m in methods]})

    if request.method == 'PATCH':
        data = _json(request)
        if data.get('isDefault'):
            PaymentMethod.objects.filter(user=user).update(is_default=False)
            pm.is_default = True
            pm.save()
        methods = PaymentMethod.objects.filter(user=user)
        return JsonResponse({'paymentMethods': [m.to_dict() for m in methods]})


# ── Addresses API ────────────────────────────────────────────

@csrf_exempt
@require_http_methods(['GET', 'POST'])
def api_addresses(request):
    user = _require_auth(request)
    if not user:
        return JsonResponse({'error': 'Authentication required.'}, status=401)

    if request.method == 'GET':
        addrs = Address.objects.filter(user=user)
        return JsonResponse({'addresses': [a.to_dict() for a in addrs]})

    if request.method == 'POST':
        data = _json(request)
        addr1 = str(data.get('addressLine1') or '').strip()
        city  = str(data.get('city') or '').strip()
        if not addr1 or not city:
            return JsonResponse({'error': 'Address line 1 and city are required.'}, status=400)

        make_default = bool(data.get('isDefault')) or not Address.objects.filter(user=user).exists()
        if make_default:
            Address.objects.filter(user=user).update(is_default=False)

        addr = Address.objects.create(
            user=user,
            full_name=str(data.get('fullName') or ''),
            address1=addr1,
            address2=str(data.get('addressLine2') or ''),
            city=city,
            state_region=str(data.get('stateRegion') or ''),
            postal_code=str(data.get('postalCode') or ''),
            country=str(data.get('country') or 'Rwanda'),
            phone=str(data.get('phone') or ''),
            is_default=make_default,
        )
        return JsonResponse({'address': addr.to_dict()}, status=201)


@csrf_exempt
@require_http_methods(['PATCH', 'DELETE'])
def api_address_detail(request, addr_id):
    user = _require_auth(request)
    if not user:
        return JsonResponse({'error': 'Authentication required.'}, status=401)

    try:
        addr = Address.objects.get(pk=addr_id, user=user)
    except Address.DoesNotExist:
        return JsonResponse({'error': 'Address not found.'}, status=404)

    if request.method == 'DELETE':
        addr.delete()
        addrs = Address.objects.filter(user=user)
        if addrs.exists() and not addrs.filter(is_default=True).exists():
            first = addrs.first()
            first.is_default = True
            first.save()
        return JsonResponse({'addresses': [a.to_dict() for a in Address.objects.filter(user=user)]})

    if request.method == 'PATCH':
        data = _json(request)
        if data.get('isDefault'):
            Address.objects.filter(user=user).update(is_default=False)
            addr.is_default = True
            addr.save()
        # Allow updating fields
        for field, model_field in [
            ('fullName', 'full_name'), ('addressLine1', 'address1'),
            ('addressLine2', 'address2'), ('city', 'city'),
            ('stateRegion', 'state_region'), ('postalCode', 'postal_code'),
            ('country', 'country'), ('phone', 'phone'),
        ]:
            if field in data:
                setattr(addr, model_field, str(data[field]))
        addr.save()
        return JsonResponse({'address': addr.to_dict()})

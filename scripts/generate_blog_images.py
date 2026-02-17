"""
MemberBook Blog Header Image Generator
Digital Meridian philosophy — systematic luminosity, structured spatial tension
"""

from PIL import Image, ImageDraw, ImageFont
import os
import math

FONTS = r"C:\Users\lenovo\.claude\plugins\cache\anthropic-agent-skills\document-skills\69c0b1a06741\skills\canvas-design\canvas-fonts"
OUT = r"C:\Projects\MemberBook\public\blog"
os.makedirs(OUT, exist_ok=True)

W, H = 1200, 630


def font(name, size):
    try:
        return ImageFont.truetype(os.path.join(FONTS, name), size)
    except Exception as e:
        print(f"  Font warning: {name} — {e}")
        return ImageFont.load_default()


def draw_rounded_rect(draw, xy, radius, fill):
    x0, y0, x1, y1 = xy
    draw.rectangle([x0 + radius, y0, x1 - radius, y1], fill=fill)
    draw.rectangle([x0, y0 + radius, x1, y1 - radius], fill=fill)
    draw.ellipse([x0, y0, x0 + radius * 2, y0 + radius * 2], fill=fill)
    draw.ellipse([x1 - radius * 2, y0, x1, y0 + radius * 2], fill=fill)
    draw.ellipse([x0, y1 - radius * 2, x0 + radius * 2, y1], fill=fill)
    draw.ellipse([x1 - radius * 2, y1 - radius * 2, x1, y1], fill=fill)


def alpha_composite_rect(img, xy, radius, color_rgba):
    """Draw a semi-transparent rounded rectangle via compositing."""
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    draw_rounded_rect(d, xy, radius, color_rgba)
    img = Image.alpha_composite(img, layer)
    return img


def alpha_text(img, xy, text, fnt, color_rgba):
    """Draw semi-transparent text via compositing."""
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.text(xy, text, font=fnt, fill=color_rgba)
    return Image.alpha_composite(img, layer)


def alpha_ellipse(img, xy, color_rgba):
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.ellipse(xy, fill=color_rgba)
    return Image.alpha_composite(img, layer)


# ─── IMAGE 1: Gym Member Management ──────────────────────────────────────────

def create_gym_image():
    # RGBA canvas
    img = Image.new("RGBA", (W, H), (30, 27, 75, 255))
    draw = ImageDraw.Draw(img)

    # Background gradient — subtle darkening toward bottom-right
    for y in range(H):
        t = y / H
        r = int(30 + t * 8)
        g = int(27 + t * 5)
        b = int(75 - t * 10)
        draw.line([(0, y), (W, y)], fill=(r, g, b, 255))

    # Subtle large circle glow — center-left
    img = alpha_ellipse(img, [180, 80, 680, 580], (79, 70, 229, 22))
    img = alpha_ellipse(img, [230, 130, 580, 510], (99, 102, 241, 12))

    draw = ImageDraw.Draw(img)

    # ─ Amber accent column ─
    draw.rectangle([62, 105, 68, 545], fill=(245, 158, 11, 255))

    # ─ Member card stack ─
    cards = [
        {"line1_w": 130, "line2_w": 72, "status": (52, 211, 153)},   # active — emerald
        {"line1_w": 108, "line2_w": 88, "status": (245, 158, 11)},   # pending — amber
        {"line1_w": 142, "line2_w": 65, "status": (52, 211, 153)},
        {"line1_w":  92, "line2_w": 78, "status": (245, 158, 11)},
        {"line1_w": 118, "line2_w": 58, "status": (148, 163, 184)},  # inactive — muted
    ]

    card_x, card_y0 = 82, 118
    card_w, card_h, card_gap = 330, 70, 12

    for i, card in enumerate(cards):
        y = card_y0 + i * (card_h + card_gap)
        fade = max(40, 210 - i * 35)

        # Card body
        img = alpha_composite_rect(
            img, (card_x, y, card_x + card_w, y + card_h), 10,
            (55, 48, 163, fade)
        )
        draw = ImageDraw.Draw(img)

        # Avatar circle
        av = 17
        cx, cy = card_x + 20, y + card_h // 2
        draw.ellipse([cx - av, cy - av, cx + av, cy + av],
                     fill=(99, 102, 241, fade))

        # Name bar
        img = alpha_composite_rect(
            img, (card_x + 50, y + 16, card_x + 50 + card["line1_w"], y + 28), 4,
            (255, 255, 255, min(220, fade + 30))
        )
        # Sub bar
        img = alpha_composite_rect(
            img, (card_x + 50, y + 38, card_x + 50 + card["line2_w"], y + 48), 3,
            (255, 255, 255, min(120, fade))
        )

        # Status dot
        draw = ImageDraw.Draw(img)
        sx = card_x + card_w - 26
        sy = y + card_h // 2
        r_s = 7
        sc = card["status"]
        draw.ellipse([sx - r_s, sy - r_s, sx + r_s, sy + r_s],
                     fill=(*sc, fade))

    draw = ImageDraw.Draw(img)

    # ─ Dot grid — top-right decorative field ─
    for gx in range(830, 1160, 28):
        for gy in range(50, 260, 28):
            dist = math.hypot(gx - 995, gy - 155)
            op = max(0, int(70 - dist * 0.16))
            if op > 4:
                img = alpha_ellipse(img, [gx - 2, gy - 2, gx + 2, gy + 2],
                                    (99, 102, 241, op))
    draw = ImageDraw.Draw(img)

    # ─ Typography — right zone ─
    f_label = font("GeistMono-Regular.ttf", 13)
    f_h1 = font("BigShoulders-Bold.ttf", 92)
    f_sub = font("InstrumentSans-Regular.ttf", 20)
    f_wm = font("GeistMono-Regular.ttf", 12)

    # Label
    draw.text((500, 152), "GYM MANAGEMENT", font=f_label,
              fill=(245, 158, 11, 230))

    # Headline line 1 — white
    draw.text((498, 188), "GYM MEMBER", font=f_h1, fill=(255, 255, 255, 255))
    # Headline line 2 — amber
    draw.text((498, 278), "MANAGEMENT", font=f_h1, fill=(245, 158, 11, 255))

    # Amber rule
    draw.rectangle([498, 384, 820, 388], fill=(245, 158, 11, 255))

    # Subtitle lines
    draw.text((500, 400), "Track members  ·  Manage subscriptions",
              font=f_sub, fill=(165, 180, 252, 200))
    draw.text((500, 428), "Send reminders  ·  Reduce payment defaults",
              font=f_sub, fill=(165, 180, 252, 200))

    # Bottom amber bar
    draw.rectangle([0, H - 5, W, H], fill=(245, 158, 11, 255))

    # Watermark
    draw.text((W - 154, H - 28), "memberbook.app", font=f_wm,
              fill=(99, 102, 241, 170))

    # Save
    out = img.convert("RGB")
    path = os.path.join(OUT, "how-to-manage-gym-members.png")
    out.save(path, "PNG")
    print(f"  ✓ Saved: {path}")


# ─── IMAGE 2: Reduce Payment Defaults ────────────────────────────────────────

def draw_checkmark(draw, cx, cy, size, color):
    """Draw a manual checkmark (tick) using lines."""
    sw = max(2, size // 6)
    # Short leg: center-left to center
    x1 = int(cx - size * 0.35)
    y1 = int(cy + size * 0.0)
    x2 = int(cx - size * 0.05)
    y2 = int(cy + size * 0.38)
    # Long leg: center to top-right
    x3 = int(cx + size * 0.40)
    y3 = int(cy - size * 0.38)
    draw.line([(x1, y1), (x2, y2)], fill=color, width=sw)
    draw.line([(x2, y2), (x3, y3)], fill=color, width=sw)


def create_payment_image():
    img = Image.new("RGBA", (W, H), (15, 23, 42, 255))
    draw = ImageDraw.Draw(img)

    # Background gradient — subtle lift toward top-left
    for y in range(H):
        t = y / H
        r = int(15 + t * 6)
        g = int(23 + t * 8)
        b = int(42 + t * 12)
        draw.line([(0, y), (W, y)], fill=(r, g, b, 255))

    # Emerald glow — behind calendar
    img = alpha_ellipse(img, [50, 60, 520, 560], (16, 185, 129, 14))
    img = alpha_ellipse(img, [100, 110, 460, 500], (16, 185, 129, 9))

    # ─ Calendar block ─
    cal_x, cal_y = 78, 108
    cal_w, cal_h = 300, 290

    # Calendar shadow
    img = alpha_composite_rect(
        img, (cal_x + 6, cal_y + 6, cal_x + cal_w + 6, cal_y + cal_h + 6), 14,
        (0, 0, 0, 60)
    )
    # Calendar body
    img = alpha_composite_rect(
        img, (cal_x, cal_y, cal_x + cal_w, cal_y + cal_h), 14,
        (30, 41, 59, 255)
    )
    # Calendar header
    img = alpha_composite_rect(
        img, (cal_x, cal_y, cal_x + cal_w, cal_y + 44), 14,
        (5, 150, 105, 255)
    )
    # Fix header bottom corners (square)
    img = alpha_composite_rect(
        img, (cal_x, cal_y + 30, cal_x + cal_w, cal_y + 44), 0,
        (5, 150, 105, 255)
    )

    draw = ImageDraw.Draw(img)

    f_cal_hdr = font("InstrumentSans-Bold.ttf", 14)
    draw.text((cal_x + 16, cal_y + 14), "PAYMENT SCHEDULE", font=f_cal_hdr,
              fill=(255, 255, 255, 255))

    # Calendar grid
    cols, rows_count = 7, 5
    cg_x = cal_x + 10
    cg_y = cal_y + 56
    cell_w = (cal_w - 20) // cols
    cell_h = 40

    day_grid = [
        [1, 2, 3, 4, 5, 6, 7],
        [8, 9, 10, 11, 12, 13, 14],
        [15, 16, 17, 18, 19, 20, 21],
        [22, 23, 24, 25, 26, 27, 28],
        [29, 30, 31, 0, 0, 0, 0],
    ]
    paid = {3, 7, 10, 15, 22, 28}

    f_day = font("DMMono-Regular.ttf", 13)

    for row, week in enumerate(day_grid):
        for col, day in enumerate(week):
            if day == 0:
                continue
            dx = cg_x + col * cell_w
            dy = cg_y + row * cell_h
            if day in paid:
                img = alpha_composite_rect(
                    img, (dx + 2, dy + 2, dx + cell_w - 2, dy + cell_h - 4), 6,
                    (16, 185, 129, 180)
                )
                draw = ImageDraw.Draw(img)
                # Draw checkmark manually
                cx = dx + cell_w // 2
                cy = dy + cell_h // 2
                draw_checkmark(draw, cx, cy, cell_w - 8, (255, 255, 255, 255))
            else:
                draw = ImageDraw.Draw(img)
                draw.text((dx + 7, dy + 10), str(day), font=f_day,
                          fill=(71, 85, 105, 255))

    draw = ImageDraw.Draw(img)

    # Emerald accent line — left edge of calendar
    draw.rectangle([cal_x - 4, cal_y, cal_x - 1, cal_y + cal_h],
                   fill=(16, 185, 129, 255))

    # ─ Ghost rupee symbol — decorative ─
    f_rup = font("BigShoulders-Bold.ttf", 160)
    img = alpha_text(img, (388, 148), "Rs", f_rup, (16, 185, 129, 18))
    draw = ImageDraw.Draw(img)

    # ─ Dot grid — top-right ─
    for gx in range(870, 1170, 26):
        for gy in range(40, 280, 26):
            dist = math.hypot(gx - 1010, gy - 155)
            op = max(0, int(65 - dist * 0.14))
            if op > 4:
                img = alpha_ellipse(img, [gx - 2, gy - 2, gx + 2, gy + 2],
                                    (16, 185, 129, op))
    draw = ImageDraw.Draw(img)

    # ─ Typography — right zone ─
    f_label = font("GeistMono-Regular.ttf", 13)
    f_h1 = font("WorkSans-Bold.ttf", 90)
    f_sub = font("InstrumentSans-Regular.ttf", 19)
    f_wm = font("GeistMono-Regular.ttf", 12)

    # Label
    draw.text((500, 152), "MEMBERSHIP MANAGEMENT", font=f_label,
              fill=(16, 185, 129, 230))

    # Headline — white + emerald
    draw.text((496, 188), "COLLECT", font=f_h1, fill=(255, 255, 255, 255))
    draw.text((496, 276), "FEES ON", font=f_h1, fill=(255, 255, 255, 255))
    draw.text((496, 364), "TIME", font=f_h1, fill=(16, 185, 129, 255))

    # Emerald rule
    draw.rectangle([496, 462, 730, 466], fill=(16, 185, 129, 255))

    # Subtitle
    draw.text((498, 476), "Automated reminders  ·  Track every payment",
              font=f_sub, fill=(100, 116, 139, 255))
    draw.text((498, 502), "Built for gyms, tuition & libraries in India",
              font=f_sub, fill=(100, 116, 139, 255))

    # Bottom emerald bar
    draw.rectangle([0, H - 5, W, H], fill=(16, 185, 129, 255))

    # Watermark
    draw.text((W - 154, H - 28), "memberbook.app", font=f_wm,
              fill=(30, 41, 59, 255))

    out = img.convert("RGB")
    path = os.path.join(OUT, "reduce-membership-payment-defaults.png")
    out.save(path, "PNG")
    print(f"  ✓ Saved: {path}")


print("Generating blog images...")
create_gym_image()
create_payment_image()
print("Done!")

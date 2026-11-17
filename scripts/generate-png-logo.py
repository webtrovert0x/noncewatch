import zlib
import struct
import math

def create_noncewatch_png(width=512, height=512, out_paths=["public/noncewatch-logo.png", "src/assets/noncewatch-logo.png"]):
    # Create RGBA buffer
    pixels = bytearray(width * height * 4)

    def set_pixel(x, y, r, g, b, a):
        if 0 <= x < width and 0 <= y < height:
            idx = (y * width + x) * 4
            # Alpha blend over existing
            src_a = a / 255.0
            dst_a = pixels[idx + 3] / 255.0
            out_a = src_a + dst_a * (1.0 - src_a)
            if out_a > 0:
                out_r = (r * src_a + pixels[idx] * dst_a * (1.0 - src_a)) / out_a
                out_g = (g * src_a + pixels[idx + 1] * dst_a * (1.0 - src_a)) / out_a
                out_b = (b * src_a + pixels[idx + 2] * dst_a * (1.0 - src_a)) / out_a
                pixels[idx] = int(min(255, max(0, out_r)))
                pixels[idx + 1] = int(min(255, max(0, out_g)))
                pixels[idx + 2] = int(min(255, max(0, out_b)))
                pixels[idx + 3] = int(min(255, max(0, out_a * 255)))

    # Distance to rounded rectangle
    def sd_rounded_rect(px, py, rx, ry, rw, rh, rad):
        cx = rx + rw / 2.0
        cy = ry + rh / 2.0
        dx = abs(px - cx) - (rw / 2.0 - rad)
        dy = abs(py - cy) - (rh / 2.0 - rad)
        ax = max(dx, 0.0)
        ay = max(dy, 0.0)
        outside_dist = math.sqrt(ax * ax + ay * ay)
        inside_dist = min(max(dx, dy), 0.0)
        return outside_dist + inside_dist - rad

    # Distance to line segment
    def sd_segment(px, py, ax, ay, bx, by):
        pax = px - ax
        pay = py - ay
        bax = bx - ax
        bay = by - ay
        h = max(0.0, min(1.0, (pax * bax + pay * bay) / (bax * bax + bay * bay)))
        dx = pax - bax * h
        dy = pay - bay * h
        return math.sqrt(dx * dx + dy * dy)

    # 1. Draw rounded container (Navy gradient + Blue border)
    box_x, box_y, box_w, box_h, box_r = 26, 26, 460, 460, 110
    border_w = 11.0

    for y in range(height):
        for x in range(width):
            d = sd_rounded_rect(x, y, box_x, box_y, box_w, box_h, box_r)
            if d <= 0.0:
                # Inside box
                # Background gradient: #0B132B to #1C2541 to #0A1128
                t = (x + y) / (width + height)
                r_val = int(11 * (1 - t) + 28 * t * 0.7 + 10 * t * 0.3)
                g_val = int(19 * (1 - t) + 37 * t * 0.7 + 17 * t * 0.3)
                b_val = int(43 * (1 - t) + 65 * t * 0.7 + 40 * t * 0.3)

                # Border check
                if d >= -border_w:
                    bt = (x + y) / (width + height)
                    br = int(96 * (1 - bt) + 29 * bt)
                    bg = int(165 * (1 - bt) + 78 * bt)
                    bb = int(250 * (1 - bt) + 216 * bt)
                    # Blend edge
                    edge_alpha = min(1.0, max(0.0, -d))
                    set_pixel(x, y, br, bg, bb, int(255 * edge_alpha))
                else:
                    set_pixel(x, y, r_val, g_val, b_val, 255)
            elif d < 1.5:
                # Anti-alias outer edge
                alpha = max(0.0, 1.0 - d / 1.5)
                set_pixel(x, y, 96, 165, 250, int(255 * alpha))

    # 2. Draw radar circles and dashed lines
    for y in range(height):
        for x in range(width):
            dist_center = math.sqrt((x - 256)**2 + (y - 256)**2)
            # Radar circle 1 (r=180)
            if abs(dist_center - 180) < 1.5:
                angle = math.atan2(y - 256, x - 256)
                if int(angle * 12) % 2 == 0:
                    set_pixel(x, y, 51, 65, 85, 120)
            # Radar circle 2 (r=110)
            if abs(dist_center - 110) < 1.2:
                set_pixel(x, y, 51, 65, 85, 90)
            # Crosshairs
            if abs(x - 256) < 1.0 and 80 < y < 432:
                if y % 8 < 4:
                    set_pixel(x, y, 51, 65, 85, 90)
            if abs(y - 256) < 1.0 and 80 < x < 432:
                if x % 8 < 4:
                    set_pixel(x, y, 51, 65, 85, 90)

    # 3. Nonce Pillars (Left & Right)
    # Left: x=[120, 150], y=[136, 376], r=15
    # Right: x=[362, 392], y=[136, 376], r=15
    for y in range(height):
        for x in range(width):
            d_left = sd_rounded_rect(x, y, 120, 136, 30, 240, 15)
            if d_left <= 0:
                set_pixel(x, y, 255, 255, 255, 255)
            elif d_left < 1.2:
                set_pixel(x, y, 255, 255, 255, int(255 * (1.0 - d_left / 1.2)))

            d_right = sd_rounded_rect(x, y, 362, 136, 30, 240, 15)
            if d_right <= 0:
                set_pixel(x, y, 255, 255, 255, 255)
            elif d_right < 1.2:
                set_pixel(x, y, 255, 255, 255, int(255 * (1.0 - d_right / 1.2)))

    # 4. Diagonal Waveform segments
    pts = [
        (136, 154),
        (213, 239),
        (243, 188),
        (269, 324),
        (299, 273),
        (376, 358)
    ]

    stroke_r = 11.0 # 22px diameter
    glow_r = 26.0

    for y in range(height):
        for x in range(width):
            # Check min dist to all segments
            min_d = 999.0
            seg_idx = 0
            for i in range(len(pts) - 1):
                d = sd_segment(x, y, pts[i][0], pts[i][1], pts[i+1][0], pts[i+1][1])
                if d < min_d:
                    min_d = d
                    seg_idx = i

            # Neon Glow
            if min_d < glow_r:
                glow_factor = (1.0 - min_d / glow_r)**2
                set_pixel(x, y, 56, 189, 248, int(110 * glow_factor))

            # Main Stroke
            if min_d <= stroke_r:
                # Color gradient along wave
                t = (x - 136) / (376 - 136)
                t = max(0.0, min(1.0, t))
                cr = int(56 * (1 - t) + 96 * t)
                cg = int(189 * (1 - t) + 165 * t)
                cb = int(248 * (1 - t) + 250 * t)
                set_pixel(x, y, cr, cg, cb, 255)
            elif min_d < stroke_r + 1.5:
                alpha = max(0.0, 1.0 - (min_d - stroke_r) / 1.5)
                set_pixel(x, y, 56, 189, 248, int(255 * alpha))

    # 5. Checkpoint Verification Nodes
    # Node 1: (136, 154) - cyan + white ring
    # Node 2: (243, 188) - blue
    # Node 3: (269, 324) - cyan
    # Node 4: (376, 358) - green + white ring
    # Center: (256, 256) - white reticle

    nodes = [
        {"x": 136, "y": 154, "r": 19, "fill": (56, 189, 248), "ring": (255, 255, 255), "ring_w": 6},
        {"x": 243, "y": 188, "r": 15, "fill": (96, 165, 250), "ring": None, "ring_w": 0},
        {"x": 269, "y": 324, "r": 15, "fill": (56, 189, 248), "ring": None, "ring_w": 0},
        {"x": 376, "y": 358, "r": 19, "fill": (34, 197, 94), "ring": (255, 255, 255), "ring_w": 6},
        {"x": 256, "y": 256, "r": 10, "fill": (255, 255, 255), "ring": None, "ring_w": 0}
    ]

    for node in nodes:
        nx, ny, nr = node["x"], node["y"], node["r"]
        for y in range(max(0, int(ny - nr - 5)), min(height, int(ny + nr + 5))):
            for x in range(max(0, int(nx - nr - 5)), min(width, int(nx + nr + 5))):
                d = math.sqrt((x - nx)**2 + (y - ny)**2)
                if d <= nr:
                    if node["ring"] and d > nr - node["ring_w"]:
                        set_pixel(x, y, node["ring"][0], node["ring"][1], node["ring"][2], 255)
                    else:
                        set_pixel(x, y, node["fill"][0], node["fill"][1], node["fill"][2], 255)
                elif d < nr + 1.5:
                    col = node["ring"] if node["ring"] else node["fill"]
                    alpha = max(0.0, 1.0 - (d - nr) / 1.5)
                    set_pixel(x, y, col[0], col[1], col[2], int(255 * alpha))

    # Encode to PNG format
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0) # Filter byte: None
        start = y * width * 4
        raw_data.extend(pixels[start:start + width * 4])

    compressed = zlib.compress(raw_data, level=9)

    png_bytes = bytearray()
    # PNG signature
    png_bytes.extend(b"\x89PNG\r\n\x1a\n")

    # IHDR chunk
    ihdr_payload = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    ihdr_crc = zlib.crc32(b"IHDR" + ihdr_payload)
    png_bytes.extend(struct.pack(">I", len(ihdr_payload)))
    png_bytes.extend(b"IHDR")
    png_bytes.extend(ihdr_payload)
    png_bytes.extend(struct.pack(">I", ihdr_crc))

    # IDAT chunk
    idat_crc = zlib.crc32(b"IDAT" + compressed)
    png_bytes.extend(struct.pack(">I", len(compressed)))
    png_bytes.extend(b"IDAT")
    png_bytes.extend(compressed)
    png_bytes.extend(struct.pack(">I", idat_crc))

    # IEND chunk
    iend_crc = zlib.crc32(b"IEND")
    png_bytes.extend(struct.pack(">I", 0))
    png_bytes.extend(b"IEND")
    png_bytes.extend(struct.pack(">I", iend_crc))

    for out_path in out_paths:
        with open(out_path, "wb") as f:
            f.write(png_bytes)
        print(f"Generated {out_path} ({len(png_bytes)} bytes)")

create_noncewatch_png()

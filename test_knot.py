import math

def add(a, b): return (a[0]+b[0], a[1]+b[1], a[2]+b[2])
def sub(a, b): return (a[0]-b[0], a[1]-b[1], a[2]-b[2])
def scale(a, s): return (a[0]*s, a[1]*s, a[2]*s)
def cross(a, b):
    return (a[1]*b[2] - a[2]*b[1],
            a[2]*b[0] - a[0]*b[2],
            a[0]*b[1] - a[1]*b[0])
def normalize(a):
    L = math.sqrt(a[0]**2 + a[1]**2 + a[2]**2)
    if L == 0: return (1,0,0)
    return (a[0]/L, a[1]/L, a[2]/L)
def dot(a, b): return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]

def curve(t):
    R = 21
    r = 9
    phi = 2 * t
    theta = 5 * t
    x = (R + r * math.cos(theta)) * math.cos(phi)
    y = (R + r * math.cos(theta)) * math.sin(phi)
    z = r * math.sin(theta)
    return (x, y, z)

T_SEG = 600
R_SEG = 36
tube_r = 5.0

vertices = []
for i in range(T_SEG):
    t = i * 2 * math.pi / T_SEG
    p0 = curve(t)
    p1 = curve(t + 0.001)
    T = normalize(sub(p1, p0))
    up = (0, 0, 1)
    if abs(dot(T, up)) > 0.99: up = (1, 0, 0)
    B = normalize(cross(T, up))
    N = normalize(cross(B, T))
    
    # Mild twist so the checkerboard follows the curve beautifully
    twist = t * 2 
    
    ring = []
    for j in range(R_SEG):
        a = j * 2 * math.pi / R_SEG + twist
        offset = add(scale(N, math.cos(a) * tube_r), scale(B, math.sin(a) * tube_r))
        ring.append(add(p0, offset))
    vertices.append(ring)

faces = []
for i in range(T_SEG):
    for j in range(R_SEG):
        i_next = (i + 1) % T_SEG
        j_next = (j + 1) % R_SEG
        v1 = vertices[i][j]
        v2 = vertices[i_next][j]
        v3 = vertices[i_next][j_next]
        v4 = vertices[i][j_next]
        
        # We need to rotate the whole thing so it looks exactly like the image
        # Let's rotate 180 degrees around Z so the point is at the bottom.
        # Actually just negate X and Y.
        def rot(v): return (-v[0], -v[1], v[2])
        rv1 = rot(v1)
        rv2 = rot(v2)
        rv3 = rot(v3)
        rv4 = rot(v4)
        
        cz = (rv1[2]+rv2[2]+rv3[2]+rv4[2])/4
        
        U = sub(rv2, rv1)
        V = sub(rv4, rv1)
        norm = normalize(cross(U, V))
        
        checker = (i % 2) == (j % 2)
        
        faces.append({
            'z': cz,
            'poly': [rv1, rv2, rv3, rv4],
            'norm': norm,
            'checker': checker
        })

faces.sort(key=lambda f: f['z'])

svg = ['<svg viewBox="-40 -40 80 80" xmlns="http://www.w3.org/2000/svg">']
# Light from top-left (in SVG, Y is down, so top-left is -X, -Y)
light_dir = normalize((-1, -1, 1))

for f in faces:
    p = f['poly']
    points_str = " ".join([f"{round(v[0],2)},{round(v[1],2)}" for v in p])
    
    # pure dot product, then mapped
    ndotl = dot(f['norm'], light_dir)
    intensity = max(0.0, ndotl)
    
    if f['checker']:
        # Black square, pure black in shadows, max dark grey in light
        val = int(40 * intensity)
        r = g = b = val
    else:
        # White square, gets completely black in shadow, pure white in light
        val = int(20 + 235 * intensity)
        r = g = b = val
        
    color = f"#{r:02x}{g:02x}{b:02x}"
    svg.append(f'<polygon points="{points_str}" fill="{color}" stroke="{color}" stroke-width="0.2"/>')

svg.append('</svg>')

with open("public/logo.svg", "w") as out:
    out.write("\n".join(svg))
print("Saved public/logo.svg")

#version 430

layout(location = 0) out vec4 fragColor;

layout(binding = 0) uniform sampler2D iChannel0;

layout (push_constant) uniform Constants {
    vec2 iMouse;
    float iTime;
} constants;

const vec2 iResolution = vec2(1280, 720);

#define MAX_STEPS 1000
#define MAX_DIST 40.0
#define SURFACE_DIST 0.001
#define PLANE_SHIFT 1.3
#define EPS 0.001
#define PI 3.14159265358979

vec3 lightPos = vec3(2.0, 5.0, 5.0);

float torusSDF(vec3 p, vec2 t) {
    vec2 q = vec2(length(p.xy) - t.x, p.z);
    return length(q) - t.y;
}

float planeSDF(vec3 p) {
    return p.y + PLANE_SHIFT;
}

float sceneSDF(vec3 p) {
    float angle = constants.iTime;
    float c = cos(angle);
    float s = sin(angle);
        
    vec3 rotatedP = vec3(p.x + s, p.y * c - p.z * s, p.y * s + p.z * c);
    
    float dTorus = torusSDF(rotatedP, vec2(0.7, 0.2));
    float dPlane = planeSDF(p);
    
    return min(dTorus, dPlane);
}

vec3 getNormal(vec3 p) {
    vec2 e = vec2(EPS, 0);
    
    return normalize(vec3(
        sceneSDF(p + e.xyy) - sceneSDF(p - e.xyy),
        sceneSDF(p + e.yxy) - sceneSDF(p - e.yxy),
        sceneSDF(p + e.yyx) - sceneSDF(p - e.yyx)
    ));
}

float shadow(vec3 ro, vec3 rd) {
    float res = 1.0;
    float t = 0.1;

    for (int i = 0; i < MAX_STEPS; i++) {
        float h = sceneSDF(ro + rd * t);

        if (h < SURFACE_DIST) {
            return 0.0;
        }
        res = min(res, 10.0 * h / t);
        t += h;
        if (t > MAX_DIST) {
            break;
        }
    }

    return res;
}

vec3 getLight(vec3 p, vec3 normal, vec3 lightDir, vec3 viewDir) {
    float diff = max(dot(normal, lightDir), 0.0);
    float shadowFactor = shadow(p + normal * SURFACE_DIST, lightDir);
    return vec3(0.1) + vec3(1.0) * diff * shadowFactor;
}

float rayMarch(vec3 ro, vec3 rd) {
    float dist = 0.0;

    for (int i = 0; i < MAX_STEPS; i++) {
        vec3 p = ro + rd * dist;
        float d = sceneSDF(p);

        if (d < SURFACE_DIST) {
            return dist;
        }

        dist += d;

        if (dist > MAX_DIST) {
            break;
        }
    }

    return MAX_DIST;
}

float noise(vec2 p) {
    return sin(p.x + p.y + sin(p.x) + sin(p.y) + constants.iTime);
        
}

vec3 generateProceduralTexture(vec3 p) {
    float n = max(noise(vec2(p.x, p.z)), 0.0);
    return vec3(n);
}

mat3 rotateY(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat3(
        c, 0, s,
        0, 1, 0,
        -s, 0, c
    );
}

mat3 rotateX(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat3(
        1, 0, 0,
        0, c, -s,
        0, s, c
    );
}

vec3 getTexture(sampler2D channel, vec2 proj) {
    return pow(texture(channel, proj).rgb, vec3(2.2));
}

void main() {
    ivec2 fragCoord = ivec2(gl_FragCoord.xy);

    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;  
    uv.y = -uv.y;

    float yMove = (constants.iMouse.x / iResolution.x - 0.5) * 2. * PI;
    float xMove = (constants.iMouse.y / iResolution.y - 0.5) * PI;

    mat3 rotate = rotateY(yMove) * rotateX(xMove);
    vec3 cameraPosition = rotate * vec3(0.0, 1.0, 10.0);
    vec3 rayDirection = rotate * normalize(vec3(uv, -2));

    float dist = rayMarch(cameraPosition, rayDirection);

    vec3 color = vec3(0.0);

    if (dist < MAX_DIST) {
        vec3 p = cameraPosition + rayDirection * dist;
        vec3 normal = getNormal(p);
        
        vec2 xProj = p.yz;
        vec2 yProj = p.xz;
        vec2 zProj = p.xy;

        if (p.y > -PLANE_SHIFT + 0.1) {
            float c = cos(constants.iTime);
            float s = sin(constants.iTime);
        
            vec3 compensatedP = vec3(
                p.x + s,
                p.y * c - p.z * s,
                p.y * s + p.z * c
            );

            xProj = compensatedP.yz * 0.1;
            yProj = compensatedP.xz * 0.1;
            zProj = compensatedP.xy * 0.1;

        } else {
            color = generateProceduralTexture(p) * 0.2;
        }
        
        float weightX = abs(normal.x);
        float weightY = abs(normal.y);
        float weightZ = abs(normal.z);

        float totalWeight = weightX + weightY + weightZ;
        weightX /= totalWeight;
        weightY /= totalWeight;
        weightZ /= totalWeight;


        vec3 texColorX = getTexture(iChannel0, xProj);
        vec3 texColorY = vec3(1.0, 0.3, 0.8);
        vec3 texColorZ = getTexture(iChannel0, zProj);
        color += texColorX * weightX + texColorY * weightY + texColorZ * weightZ;
        
        vec3 lightDir = normalize(lightPos - p);
        vec3 viewDir = normalize(cameraPosition - p);

        color *= getLight(p, normal, lightDir, viewDir);
    }

    color = pow(color, vec3(1.0 / 2.2));
    fragColor = vec4(color, 0.0);
}
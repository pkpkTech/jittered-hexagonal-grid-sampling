const hexSide = 0.8660254037844386;

const vertices = [
    [
        0.0,
        -1.0
    ],
    [
        hexSide,
        -0.5
    ],
    [
        hexSide,
        0.5
    ],
    [
        0.0,
        1.0
    ],
    [
        -hexSide,
        0.5
    ],
    [
        -hexSide,
        -0.5
    ]
];

interface Rect { width: number, height: number }

interface Options {
    shape: Rect;
    radius: number,
    jitter?: number,
}

interface Coords {
    x: number;
    y: number;
}
interface Point extends Coords {
    angle?: number;
    tries?: number;
}

export class JitteredHexagonalGridSampling {

    /**
     * JitteredHexagonalGridSampling constructor
     * @param {object} options Options
     * @param {Array} options.shape Shape of the space
     * @param {float} options.radius Minimum distance between each points
     * @param {float} [options.jitter] Jitter amount, defaults to 0.666
     * @param {function|null} [rng] RNG function, defaults to Math.random
     * @constructor
     */
    constructor(options: Options, rng?: () => number) {
        this.width = options.shape.width;
        this.height = options.shape.height;
        this.r = options.radius;
        this.jitter = options.jitter ?? 0.6666;
        this.jitterRadius = this.r * this.jitter;

        this.rng = rng ?? Math.random;

        this.maxY = Math.ceil(this.height / this.r);
        this.maxXEven = Math.ceil(this.width / (this.r * 2 * hexSide) + 0.5);
        this.maxXOdd = Math.ceil(this.width / (this.r * 2 * hexSide));

        this.currentX = 0;
        this.currentY = 0;
        this.samplePoints = [];
    }

    width: number;
    height: number;
    r: number;
    jitter: number;
    jitterRadius: number;

    rng: () => number;

    maxY: number;
    maxXEven: number;
    maxXOdd: number;

    currentX: number;
    currentY: number;
    samplePoints: Point[];

    /**
     * Get all the points in the grid.
     * @returns {Array[]} Sample points
     */
    getAllPoints(): Point[] {
        return this.samplePoints;
    };

    /**
     * Try to generate a new point in the grid, returns null if it wasn't possible
     * @returns {Array|null} The added point or null
     */
    next(): Point | null {
        let y = this.currentY;
        let x = this.currentX;

        for (; y < this.maxY; y++) {
            const yOdd = y % 2;
            for (; x < (yOdd ? this.maxXOdd : this.maxXEven); x++) {
                const cx = (x * 2 + yOdd) * this.r * hexSide;
                const cy = y * 1.5 * this.r;

                let p = this.rng() * 6;
                let q = this.rng();
                const tri = p | 0;
                p = p % 1;

                const v0 = vertices[tri];
                const v1 = vertices[(tri + 1) % 6];

                if (p + q > 1) {
                    p = 1 - p;
                    q = 1 - q;
                }

                const point = {
                    x: cx + (v0[0] * p + v1[0] * q) * this.jitterRadius,
                    y: cy + (v0[1] * p + v1[1] * q) * this.jitterRadius
                };

                if (point.x < 0 || point.x >= this.width || point.y < 0 || point.y >= this.height) {
                    continue;
                }

                this.samplePoints.push(point);
                this.currentY = y;
                this.currentX = x + 1;

                return point;
            }

            x = 0;
        }

        return null;
    };

    /**
     * Automatically fill the grid.
     * @returns {Array[]} Sample points
     */
    fill(): Point[] {
        while (this.next()) { }

        return this.samplePoints;
    };

    /**
     * Reinitialize the grid as well as the internal state
     */
    reset(): void {
        this.samplePoints = [];
        this.currentX = this.currentY = 0;
    };
}

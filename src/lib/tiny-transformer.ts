export const VOCAB = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ.:*+=-/#%&";
export const MAX_TOKENS = 20;
export const TRACE_ROWS = 8;
export const MAX_ARCS = 12;
export const ARC_STRIDE = 4;
export const CANDIDATE_COUNT = 5;
export const STAGES = 5;
export const STAGE_NODES = 12;
export const EDGES_PER_GAP = 36;

const D_MODEL = 32;
const LAYERS = 3;
const HEADS = 4;
const D_HEAD = 8;
const D_FFN = 64;
const LOCALITY = 0.6;
const LOCALITY_SPAN = 2.5;

const NODE_DIMS: ReadonlyArray<number> = [0, 2, 5, 8, 10, 13, 16, 18, 21, 24, 26, 29];
const LOGIT_DIMS: ReadonlyArray<number> = [0, 3, 7, 10, 14, 17, 21, 24, 28, 31, 35, 38];

type Matrix = Float32Array<ArrayBuffer>;
type Vector = Float32Array<ArrayBuffer>;

type LayerWeights = {
  readonly wq: Matrix;
  readonly wk: Matrix;
  readonly wv: Matrix;
  readonly wo: Matrix;
  readonly w1: Matrix;
  readonly w2: Matrix;
  readonly lnAttnGain: Vector;
  readonly lnMlpGain: Vector;
};

export type TinyModel = {
  readonly embed: Matrix;
  readonly unembed: Matrix;
  readonly lnFinalGain: Vector;
  readonly layers: ReadonlyArray<LayerWeights>;
};

export type ForwardTrace = {
  readonly tokens: Uint32Array<ArrayBuffer>;
  readonly norms: Matrix;
  readonly arcs: Matrix;
  readonly arcCount: number;
  readonly candidates: Matrix;
  readonly stages: Matrix;
};

export function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rng: () => number): number {
  const u = Math.max(rng(), 1e-6);
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function matrix(rows: number, cols: number, scale: number, rng: () => number): Matrix {
  const out = new Float32Array(rows * cols);
  for (let i = 0; i < out.length; i += 1) {
    out[i] = gaussian(rng) * scale;
  }
  return out;
}

function gains(size: number, rng: () => number): Vector {
  const out = new Float32Array(size);
  for (let i = 0; i < size; i += 1) {
    out[i] = 1 + gaussian(rng) * 0.05;
  }
  return out;
}

export function createModel(seed = 11): TinyModel {
  const rng = createRng(seed);
  const layers: Array<LayerWeights> = [];
  for (let l = 0; l < LAYERS; l += 1) {
    layers.push({
      wq: matrix(D_MODEL, D_MODEL, 0.08, rng),
      wk: matrix(D_MODEL, D_MODEL, 0.08, rng),
      wv: matrix(D_MODEL, D_MODEL, 0.08, rng),
      wo: matrix(D_MODEL, D_MODEL, 0.06, rng),
      w1: matrix(D_MODEL, D_FFN, 0.06, rng),
      w2: matrix(D_FFN, D_MODEL, 0.05, rng),
      lnAttnGain: gains(D_MODEL, rng),
      lnMlpGain: gains(D_MODEL, rng),
    });
  }
  return {
    embed: matrix(VOCAB.length, D_MODEL, 0.4, rng),
    unembed: matrix(D_MODEL, VOCAB.length, 0.08, rng),
    lnFinalGain: gains(D_MODEL, rng),
    layers,
  };
}

export function tokenize(text: string): Uint32Array<ArrayBuffer> {
  const ids: Array<number> = [];
  for (const character of text.toUpperCase()) {
    const id = VOCAB.indexOf(character);
    if (id >= 0 && ids.length < MAX_TOKENS) {
      ids.push(id);
    }
  }
  return Uint32Array.from(ids);
}

function dense(
  input: Matrix,
  rows: number,
  din: number,
  weight: Matrix,
  dout: number,
  out: Matrix,
): void {
  for (let t = 0; t < rows; t += 1) {
    for (let o = 0; o < dout; o += 1) {
      let sum = 0;
      for (let i = 0; i < din; i += 1) {
        sum += input[t * din + i] * weight[i * dout + o];
      }
      out[t * dout + o] = sum;
    }
  }
}

function layernorm(
  input: Matrix,
  rows: number,
  dim: number,
  gain: Vector,
  out: Matrix,
): void {
  for (let t = 0; t < rows; t += 1) {
    let mean = 0;
    for (let i = 0; i < dim; i += 1) {
      mean += input[t * dim + i];
    }
    mean /= dim;
    let variance = 0;
    for (let i = 0; i < dim; i += 1) {
      const delta = input[t * dim + i] - mean;
      variance += delta * delta;
    }
    variance /= dim;
    const inv = 1 / Math.sqrt(variance + 1e-5);
    for (let i = 0; i < dim; i += 1) {
      out[t * dim + i] = (input[t * dim + i] - mean) * inv * gain[i];
    }
  }
}

function gelu(value: number): number {
  return 0.5 * value * (1 + Math.tanh(0.7978845608 * (value + 0.044715 * value * value * value)));
}

function softmax(out: Matrix, values: Matrix, length: number): void {
  let max = -Infinity;
  for (let i = 0; i < length; i += 1) {
    if (values[i] > max) max = values[i];
  }
  let sum = 0;
  for (let i = 0; i < length; i += 1) {
    const e = Math.exp(values[i] - max);
    out[i] = e;
    sum += e;
  }
  for (let i = 0; i < length; i += 1) {
    out[i] /= sum;
  }
}

function recordNorms(target: Matrix, row: number, hidden: Matrix, count: number): void {
  let min = Infinity;
  let max = -Infinity;
  for (let t = 0; t < count; t += 1) {
    let sum = 0;
    for (let i = 0; i < D_MODEL; i += 1) {
      const value = hidden[t * D_MODEL + i];
      sum += value * value;
    }
    const norm = Math.sqrt(sum);
    target[row * MAX_TOKENS + t] = norm;
    if (norm < min) min = norm;
    if (norm > max) max = norm;
  }
  const span = Math.max(max - min, 1e-6);
  for (let t = 0; t < count; t += 1) {
    target[row * MAX_TOKENS + t] = Math.min(1, 0.05 + 0.95 * ((target[row * MAX_TOKENS + t] - min) / span));
  }
}

function sampleStage(
  target: Matrix,
  stage: number,
  vector: Matrix,
  dims: ReadonlyArray<number>,
  offset: number,
): void {
  for (let i = 0; i < STAGE_NODES; i += 1) {
    target[stage * STAGE_NODES + i] = Math.abs(vector[offset + dims[i]]);
  }
}

function normalizeStage(target: Matrix, stage: number): void {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < STAGE_NODES; i += 1) {
    const value = target[stage * STAGE_NODES + i];
    if (value < min) min = value;
    if (value > max) max = value;
  }
  const span = Math.max(max - min, 1e-6);
  for (let i = 0; i < STAGE_NODES; i += 1) {
    target[stage * STAGE_NODES + i] = Math.min(
      1,
      Math.max(0, (target[stage * STAGE_NODES + i] - min) / span),
    );
  }
}

export function edgeMatrix(model: TinyModel): Matrix {
  const out = new Float32Array((STAGES - 1) * EDGES_PER_GAP * 4);
  for (let g = 0; g < STAGES - 1; g += 1) {
    const weight = g < LAYERS ? model.layers[g].wo : model.unembed;
    const outDimTotal = g < LAYERS ? D_MODEL : VOCAB.length;
    const outDims = g < LAYERS ? NODE_DIMS : LOGIT_DIMS;
    const scores = new Float32Array(STAGE_NODES * STAGE_NODES);
    let max = 1e-6;
    for (let i = 0; i < STAGE_NODES; i += 1) {
      for (let j = 0; j < STAGE_NODES; j += 1) {
        const value = Math.abs(weight[NODE_DIMS[i] * outDimTotal + outDims[j]]);
        scores[i * STAGE_NODES + j] = value;
        if (value > max) max = value;
      }
    }
    for (let i = 0; i < STAGE_NODES; i += 1) {
      const order: Array<number> = [];
      for (let j = 0; j < STAGE_NODES; j += 1) {
        order.push(j);
      }
      order.sort((a, b) => scores[i * STAGE_NODES + b] - scores[i * STAGE_NODES + a]);
      for (let k = 0; k < 3; k += 1) {
        const j = order[k];
        const slot = (g * EDGES_PER_GAP + i * 3 + k) * 4;
        out[slot] = i;
        out[slot + 1] = j;
        out[slot + 2] = scores[i * STAGE_NODES + j] / max;
        out[slot + 3] = g;
      }
    }
  }
  return out;
}

export function forward(model: TinyModel, tokens: Uint32Array<ArrayBuffer>, position = -1): ForwardTrace {
  const count = tokens.length;
  const at = position >= 0 ? Math.min(position, count - 1) : count - 1;
  const stages = new Float32Array(STAGES * STAGE_NODES);
  const hidden = new Float32Array(count * D_MODEL);
  for (let t = 0; t < count; t += 1) {
    for (let i = 0; i < D_MODEL; i += 1) {
      hidden[t * D_MODEL + i] = model.embed[tokens[t] * D_MODEL + i];
    }
  }

  const norms = new Float32Array(TRACE_ROWS * MAX_TOKENS);
  recordNorms(norms, 0, hidden, count);
  sampleStage(stages, 0, hidden, NODE_DIMS, at * D_MODEL);

  const arcs = new Float32Array(MAX_ARCS * ARC_STRIDE);
  let arcCount = 0;

  const normed = new Float32Array(count * D_MODEL);
  const q = new Float32Array(count * D_MODEL);
  const k = new Float32Array(count * D_MODEL);
  const v = new Float32Array(count * D_MODEL);
  const headOut = new Float32Array(count * D_MODEL);
  const projected = new Float32Array(count * D_MODEL);
  const ffnHidden = new Float32Array(count * D_FFN);
  const scores = new Float32Array(count);
  const weights = new Float32Array(count);
  const attn = new Float32Array(count * count);

  for (let l = 0; l < LAYERS; l += 1) {
    const layer = model.layers[l];
    layernorm(hidden, count, D_MODEL, layer.lnAttnGain, normed);
    dense(normed, count, D_MODEL, layer.wq, D_MODEL, q);
    dense(normed, count, D_MODEL, layer.wk, D_MODEL, k);
    dense(normed, count, D_MODEL, layer.wv, D_MODEL, v);

    headOut.fill(0);
    attn.fill(0);
    for (let h = 0; h < HEADS; h += 1) {
      const offset = h * D_HEAD;
      for (let t = 0; t < count; t += 1) {
        for (let s = 0; s <= t; s += 1) {
          let dot = 0;
          for (let i = 0; i < D_HEAD; i += 1) {
            dot += q[t * D_MODEL + offset + i] * k[s * D_MODEL + offset + i];
          }
          scores[s] =
            dot / Math.sqrt(D_HEAD) + LOCALITY * Math.exp(-Math.abs(t - s) / LOCALITY_SPAN);
        }
        softmax(weights, scores, t + 1);
        for (let s = 0; s <= t; s += 1) {
          const a = weights[s];
          attn[t * count + s] += a / HEADS;
          for (let i = 0; i < D_HEAD; i += 1) {
            headOut[t * D_MODEL + offset + i] += a * v[s * D_MODEL + offset + i];
          }
        }
      }
    }

    dense(headOut, count, D_MODEL, layer.wo, D_MODEL, projected);
    for (let i = 0; i < hidden.length; i += 1) {
      hidden[i] += projected[i];
    }
    recordNorms(norms, 1 + 2 * l, hidden, count);

    if (count > 1 && arcCount < MAX_ARCS) {
      const last = count - 1;
      const order: Array<number> = [];
      for (let s = 0; s < last; s += 1) {
        order.push(s);
      }
      order.sort((a, b) => attn[last * count + b] - attn[last * count + a]);
      for (const s of order.slice(0, 3)) {
        if (arcCount >= MAX_ARCS) break;
        const weight = attn[last * count + s];
        if (weight <= 0) continue;
        arcs[arcCount * ARC_STRIDE] = last;
        arcs[arcCount * ARC_STRIDE + 1] = s;
        arcs[arcCount * ARC_STRIDE + 2] = weight;
        arcs[arcCount * ARC_STRIDE + 3] = 1 + 2 * l;
        arcCount += 1;
      }
    }

    layernorm(hidden, count, D_MODEL, layer.lnMlpGain, normed);
    dense(normed, count, D_MODEL, layer.w1, D_FFN, ffnHidden);
    for (let i = 0; i < ffnHidden.length; i += 1) {
      ffnHidden[i] = gelu(ffnHidden[i]);
    }
    dense(ffnHidden, count, D_FFN, layer.w2, D_MODEL, projected);
    for (let i = 0; i < hidden.length; i += 1) {
      hidden[i] += projected[i];
    }
    recordNorms(norms, 2 + 2 * l, hidden, count);
    if (l < 3) {
      sampleStage(stages, 1 + l, hidden, NODE_DIMS, at * D_MODEL);
    }
  }

  layernorm(hidden, count, D_MODEL, model.lnFinalGain, normed);
  recordNorms(norms, TRACE_ROWS - 1, hidden, count);

  const logits = new Float32Array(VOCAB.length);
  const finalRow = (count - 1) * D_MODEL;
  for (let o = 0; o < VOCAB.length; o += 1) {
    let sum = 0;
    for (let i = 0; i < D_MODEL; i += 1) {
      sum += normed[finalRow + i] * model.unembed[i * VOCAB.length + o];
    }
    logits[o] = sum;
  }
  const probs = new Float32Array(VOCAB.length);
  softmax(probs, logits, VOCAB.length);
  sampleStage(stages, 4, probs, LOGIT_DIMS, 0);
  for (let s = 0; s < STAGES; s += 1) {
    normalizeStage(stages, s);
  }

  const order: Array<number> = [];
  for (let i = 0; i < VOCAB.length; i += 1) {
    order.push(i);
  }
  order.sort((a, b) => probs[b] - probs[a]);

  const candidates = new Float32Array(CANDIDATE_COUNT * 2);
  let total = 0;
  for (let i = 0; i < CANDIDATE_COUNT; i += 1) {
    total += probs[order[i]];
  }
  for (let i = 0; i < CANDIDATE_COUNT; i += 1) {
    candidates[i * 2] = order[i];
    candidates[i * 2 + 1] = probs[order[i]] / Math.max(total, 1e-6);
  }

  return { tokens, norms, arcs, arcCount, candidates, stages };
}

export function sampleToken(candidates: Matrix, rng: () => number): number {
  let roll = rng();
  for (let i = 0; i < CANDIDATE_COUNT; i += 1) {
    roll -= candidates[i * 2 + 1];
    if (roll <= 0) return Math.round(candidates[i * 2]);
  }
  return Math.round(candidates[0]);
}

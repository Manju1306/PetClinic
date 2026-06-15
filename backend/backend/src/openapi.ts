import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';

const specPath = join(__dirname, '..', 'openapi.yaml');

export const openapiSpec = yaml.load(readFileSync(specPath, 'utf8')) as Record<string, unknown>;

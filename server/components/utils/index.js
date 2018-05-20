'use strict';

import * as crypto from 'crypto';

export function generateHash() {
    return crypto.randomBytes(20).toString('hex');
}

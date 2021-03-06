/**
 * This file is covered by the AGPLv3 license, which can be found at the LICENSE file in the root of this project.
 * @copyright 2020 subtitulamos.tv
 */

import dotenv from 'dotenv';
dotenv.config(); // Initializae config as early as possible

import { setup } from './server';
setup();

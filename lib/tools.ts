/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { FunctionCall } from './state';
import { personalAssistantTools } from './tools/personal-assistant';

export const AVAILABLE_TOOLS: FunctionCall[] = personalAssistantTools;
